import { ConvexError, v } from "convex/values";
import type { Doc } from "./_generated/dataModel";
import type { MutationCtx } from "./_generated/server";
import { mutation, query } from "./_generated/server";
import { isValidAllocations } from "./lib/budgetMath";
import { requirePremiumProfile } from "./lib/entitlements";
import {
	countOwnerSpaces,
	getActiveSpaceCycle,
	requireSpaceMember,
	requireSpaceOwner,
	requireSpaceWritable,
} from "./lib/spaceAuth";
import { canReactivateSpace, isSpaceWritable } from "./lib/spaceAuthLogic";
import {
	computeMemberParticipationCents,
	partitionParticipationSources,
} from "./lib/spaceParticipation";

const DEFAULT_CYCLE_DAYS = 30;

async function seedSpaceCycle(ctx: MutationCtx, space: Doc<"financialSpaces">, now: number) {
	const endDate = now + space.cycleDurationDays * 24 * 60 * 60 * 1000;
	const cycleId = await ctx.db.insert("spaceCycles", {
		spaceId: space._id,
		startDate: now,
		endDate,
		status: "active",
		totalContributionsReceived: 0,
		unallocatedCents: 0,
	});

	await Promise.all(
		(["needs", "wants", "savings"] as const).map((type) =>
			ctx.db.insert("spaceEnvelopes", {
				spaceId: space._id,
				cycleId,
				type,
				allocatedAmount: 0,
				remainingAmount: 0,
			}),
		),
	);

	return cycleId;
}

export const create = mutation({
	args: {
		name: v.string(),
		expectedContributionCents: v.optional(v.number()),
	},
	returns: v.id("financialSpaces"),
	handler: async (ctx, args) => {
		const profile = await requirePremiumProfile(ctx);
		const trimmedName = args.name.trim();
		if (trimmedName.length < 1 || trimmedName.length > 80) {
			throw new ConvexError({
				code: "VALIDATION_ERROR",
				message: "El nombre del espacio debe tener entre 1 y 80 caracteres.",
			});
		}

		const ownedSpaces = await countOwnerSpaces(ctx, profile._id);
		if (ownedSpaces >= 1) {
			throw new ConvexError({
				code: "ALREADY_EXISTS",
				message: "Ya tienes un espacio compartido activo.",
			});
		}

		const expectedContributionCents = args.expectedContributionCents ?? 0;
		if (!Number.isInteger(expectedContributionCents) || expectedContributionCents < 0) {
			throw new ConvexError({
				code: "VALIDATION_ERROR",
				message: "La meta de aporte debe ser un entero no negativo.",
			});
		}

		const now = Date.now();
		const cycleDurationDays = profile.cycleDurationDays ?? DEFAULT_CYCLE_DAYS;
		const spaceId = await ctx.db.insert("financialSpaces", {
			name: trimmedName,
			createdByProfileId: profile._id,
			status: "active",
			currencyCode: profile.currencyCode,
			currencySymbol: profile.currencySymbol,
			allocationNeeds: profile.allocationNeeds,
			allocationWants: profile.allocationWants,
			allocationSavings: profile.allocationSavings,
			cycleDurationDays,
			cycleAnchorAt: now,
			createdAt: now,
		});

		await ctx.db.insert("spaceMembers", {
			spaceId,
			profileId: profile._id,
			role: "owner",
			status: "active",
			expectedContributionCents,
			joinedAt: now,
		});

		const space = await ctx.db.get("financialSpaces", spaceId);
		if (!space)
			throw new ConvexError({
				code: "INTERNAL_ERROR",
				message: "Error al crear espacio.",
			});
		await seedSpaceCycle(ctx, space, now);

		return spaceId;
	},
});

export const getMySpaces = query({
	args: {},
	returns: v.array(
		v.object({
			spaceId: v.id("financialSpaces"),
			name: v.string(),
			status: v.union(v.literal("active"), v.literal("closed"), v.literal("readonly")),
			role: v.union(v.literal("owner"), v.literal("member")),
			currencyCode: v.string(),
			currencySymbol: v.string(),
		}),
	),
	handler: async (ctx) => {
		const identity = await ctx.auth.getUserIdentity();
		if (!identity) return [];

		const profile = await ctx.db
			.query("profiles")
			.withIndex("by_userId", (q) => q.eq("userId", identity.subject))
			.unique();
		if (!profile) return [];

		const memberships = await ctx.db
			.query("spaceMembers")
			.withIndex("by_profile", (q) => q.eq("profileId", profile._id))
			.collect();

		const activeMemberships = memberships.filter((m) => m.status === "active");
		const rows = await Promise.all(
			activeMemberships.map(async (membership) => {
				const space = await ctx.db.get("financialSpaces", membership.spaceId);
				if (!space) return null;
				return {
					spaceId: space._id,
					name: space.name,
					status: space.status,
					role: membership.role,
					currencyCode: space.currencyCode,
					currencySymbol: space.currencySymbol,
				};
			}),
		);
		return rows.filter((row): row is NonNullable<typeof row> => row !== null);
	},
});

const settingsProposalValidator = v.object({
	_id: v.id("spaceChangeProposals"),
	kind: v.union(
		v.literal("allocation"),
		v.literal("cycle_duration"),
		v.literal("expected_contribution"),
	),
	payload: v.any(),
	effectiveOn: v.union(v.literal("current_cycle"), v.literal("next_cycle")),
	status: v.literal("pending"),
	proposedByProfileId: v.id("profiles"),
	createdAt: v.number(),
});

const settingsInvitationValidator = v.object({
	_id: v.id("spaceInvitations"),
	expiresAt: v.number(),
	invitedEmail: v.optional(v.string()),
});

export const getOverview = query({
	args: { spaceId: v.id("financialSpaces") },
	returns: v.union(
		v.null(),
		v.object({
			space: v.object({
				_id: v.id("financialSpaces"),
				name: v.string(),
				status: v.union(v.literal("active"), v.literal("closed"), v.literal("readonly")),
				currencyCode: v.string(),
				currencySymbol: v.string(),
				allocationNeeds: v.number(),
				allocationWants: v.number(),
				allocationSavings: v.number(),
				cycleDurationDays: v.number(),
			}),
			viewerRole: v.union(v.literal("owner"), v.literal("member")),
			viewerProfileId: v.id("profiles"),
			ownerIsPremium: v.boolean(),
			cycle: v.union(
				v.null(),
				v.object({
					_id: v.id("spaceCycles"),
					startDate: v.number(),
					endDate: v.number(),
					totalContributionsReceived: v.number(),
					unallocatedCents: v.number(),
				}),
			),
			envelopes: v.array(
				v.object({
					type: v.union(v.literal("needs"), v.literal("wants"), v.literal("savings")),
					allocatedAmount: v.number(),
					remainingAmount: v.number(),
				}),
			),
			members: v.array(
				v.object({
					profileId: v.id("profiles"),
					name: v.string(),
					role: v.union(v.literal("owner"), v.literal("member")),
					expectedContributionCents: v.number(),
					contributedCents: v.number(),
					explicitContributionCents: v.number(),
					personalPocketCents: v.number(),
				}),
			),
			recentMovements: v.array(
				v.object({
					id: v.string(),
					kind: v.union(v.literal("contribution"), v.literal("expense")),
					label: v.string(),
					amount: v.number(),
					timestamp: v.number(),
				}),
			),
			pendingProposals: v.array(settingsProposalValidator),
		}),
	),
	handler: async (ctx, args) => {
		let membershipResult: Awaited<ReturnType<typeof requireSpaceMember>>;
		try {
			membershipResult = await requireSpaceMember(ctx, args.spaceId);
		} catch (error) {
			if (
				error instanceof ConvexError &&
				typeof error.data === "object" &&
				error.data !== null &&
				"code" in error.data
			) {
				const code = (error.data as { code: string }).code;
				if (code === "NOT_FOUND" || code === "SPACE_NOT_MEMBER") {
					return null;
				}
			}
			throw error;
		}
		const { membership, space, creator, profile } = membershipResult;

		const cycle = await getActiveSpaceCycle(ctx, space._id);
		const envelopes = cycle
			? await ctx.db
					.query("spaceEnvelopes")
					.withIndex("by_cycle_type", (q) => q.eq("cycleId", cycle._id))
					.collect()
			: [];

		const activeMembers = await ctx.db
			.query("spaceMembers")
			.withIndex("by_space_status", (q) => q.eq("spaceId", space._id).eq("status", "active"))
			.collect();

		const memberRows = await Promise.all(
			activeMembers.map(async (member) => {
				const memberProfile = await ctx.db.get("profiles", member.profileId);
				const contributions = cycle
					? await ctx.db
							.query("spaceContributions")
							.withIndex("by_cycle", (q) => q.eq("cycleId", cycle._id))
							.collect()
					: [];
				const memberContributions = contributions.filter(
					(row) => row.fromProfileId === member.profileId,
				);
				const participation = partitionParticipationSources(memberContributions);
				return {
					profileId: member.profileId,
					name: memberProfile?.name ?? "Miembro",
					role: member.role,
					expectedContributionCents: member.expectedContributionCents,
					contributedCents: computeMemberParticipationCents(memberContributions),
					explicitContributionCents: participation.explicitCents,
					personalPocketCents: participation.personalPocketCents,
				};
			}),
		);

		const [expenses, contributions] = cycle
			? await Promise.all([
					ctx.db
						.query("spaceExpenses")
						.withIndex("by_space_cycle_time", (q) =>
							q.eq("spaceId", space._id).eq("cycleId", cycle._id),
						)
						.order("desc")
						.take(10),
					ctx.db
						.query("spaceContributions")
						.withIndex("by_cycle", (q) => q.eq("cycleId", cycle._id))
						.order("desc")
						.take(10),
				])
			: [[], []];

		const pendingProposals = await ctx.db
			.query("spaceChangeProposals")
			.withIndex("by_space_status", (q) => q.eq("spaceId", space._id).eq("status", "pending"))
			.collect();

		const recentMovements = [
			...expenses.map((expense) => ({
				id: expense._id,
				kind: "expense" as const,
				label: expense.description,
				amount: expense.amount,
				timestamp: expense.timestamp,
			})),
			...contributions.map((contribution) => ({
				id: contribution._id,
				kind: "contribution" as const,
				label:
					contribution.kind === "explicit_transfer"
						? "Aporte al espacio"
						: "Gasto pagado personalmente",
				amount: contribution.amountCents,
				timestamp: contribution.createdAt,
			})),
		]
			.sort((a, b) => b.timestamp - a.timestamp)
			.slice(0, 10);

		return {
			space: {
				_id: space._id,
				name: space.name,
				status: space.status,
				currencyCode: space.currencyCode,
				currencySymbol: space.currencySymbol,
				allocationNeeds: space.allocationNeeds,
				allocationWants: space.allocationWants,
				allocationSavings: space.allocationSavings,
				cycleDurationDays: space.cycleDurationDays,
			},
			viewerRole: membership.role,
			viewerProfileId: profile._id,
			ownerIsPremium: creator.plan === "premium",
			cycle: cycle
				? {
						_id: cycle._id,
						startDate: cycle.startDate,
						endDate: cycle.endDate,
						totalContributionsReceived: cycle.totalContributionsReceived,
						unallocatedCents: cycle.unallocatedCents ?? 0,
					}
				: null,
			envelopes: envelopes.map((envelope) => ({
				type: envelope.type,
				allocatedAmount: envelope.allocatedAmount,
				remainingAmount: envelope.remainingAmount,
			})),
			members: memberRows,
			recentMovements,
			pendingProposals: pendingProposals.map((row) => ({
				_id: row._id,
				kind: row.kind,
				payload: row.payload,
				effectiveOn: row.effectiveOn,
				status: "pending" as const,
				proposedByProfileId: row.proposedByProfileId,
				createdAt: row.createdAt,
			})),
		};
	},
});

export const getSettings = query({
	args: { spaceId: v.id("financialSpaces") },
	returns: v.union(
		v.null(),
		v.object({
			space: v.object({
				_id: v.id("financialSpaces"),
				name: v.string(),
				status: v.union(v.literal("active"), v.literal("closed"), v.literal("readonly")),
				currencyCode: v.string(),
				currencySymbol: v.string(),
				allocationNeeds: v.number(),
				allocationWants: v.number(),
				allocationSavings: v.number(),
				cycleDurationDays: v.number(),
				cycleAnchorAt: v.number(),
				premiumExpiredAt: v.optional(v.number()),
				closedAt: v.optional(v.number()),
			}),
			viewerRole: v.union(v.literal("owner"), v.literal("member")),
			viewerProfileId: v.id("profiles"),
			ownerIsPremium: v.boolean(),
			isWritable: v.boolean(),
			canEditStructural: v.boolean(),
			canEditOwnGoal: v.boolean(),
			canReactivate: v.boolean(),
			cycle: v.union(
				v.null(),
				v.object({
					_id: v.id("spaceCycles"),
					startDate: v.number(),
					endDate: v.number(),
				}),
			),
			members: v.array(
				v.object({
					profileId: v.id("profiles"),
					name: v.string(),
					role: v.union(v.literal("owner"), v.literal("member")),
					joinedAt: v.number(),
					expectedContributionCents: v.number(),
					contributedCents: v.number(),
					explicitContributionCents: v.number(),
					personalPocketCents: v.number(),
				}),
			),
			pendingInvitations: v.array(settingsInvitationValidator),
			pendingProposals: v.array(settingsProposalValidator),
		}),
	),
	handler: async (ctx, args) => {
		let membershipResult: Awaited<ReturnType<typeof requireSpaceMember>>;
		try {
			membershipResult = await requireSpaceMember(ctx, args.spaceId);
		} catch (error) {
			if (
				error instanceof ConvexError &&
				typeof error.data === "object" &&
				error.data !== null &&
				"code" in error.data
			) {
				const code = (error.data as { code: string }).code;
				if (code === "NOT_FOUND" || code === "SPACE_NOT_MEMBER") {
					return null;
				}
			}
			throw error;
		}
		const { membership, space, creator, profile } = membershipResult;

		const cycle = await getActiveSpaceCycle(ctx, space._id);
		const writable = isSpaceWritable(space, creator);

		const activeMembers = await ctx.db
			.query("spaceMembers")
			.withIndex("by_space_status", (q) => q.eq("spaceId", space._id).eq("status", "active"))
			.collect();

		const [memberRows, pendingProposals, pendingInvitationRows] = await Promise.all([
			Promise.all(
				activeMembers.map(async (member) => {
					const memberProfile = await ctx.db.get("profiles", member.profileId);
					const contributions = cycle
						? await ctx.db
								.query("spaceContributions")
								.withIndex("by_cycle", (q) => q.eq("cycleId", cycle._id))
								.collect()
						: [];
					const memberContributions = contributions.filter(
						(row) => row.fromProfileId === member.profileId,
					);
					const participation = partitionParticipationSources(memberContributions);
					return {
						profileId: member.profileId,
						name: memberProfile?.name ?? "Miembro",
						role: member.role,
						joinedAt: member.joinedAt,
						expectedContributionCents: member.expectedContributionCents,
						contributedCents: computeMemberParticipationCents(memberContributions),
						explicitContributionCents: participation.explicitCents,
						personalPocketCents: participation.personalPocketCents,
					};
				}),
			),
			ctx.db
				.query("spaceChangeProposals")
				.withIndex("by_space_status", (q) => q.eq("spaceId", space._id).eq("status", "pending"))
				.collect(),
			ctx.db
				.query("spaceInvitations")
				.withIndex("by_space_status", (q) => q.eq("spaceId", space._id).eq("status", "pending"))
				.collect(),
		]);

		const pendingInvitations =
			membership.role === "owner"
				? pendingInvitationRows.map((row) => ({
						_id: row._id,
						expiresAt: row.expiresAt,
						invitedEmail: row.invitedEmail,
					}))
				: [];

		return {
			space: {
				_id: space._id,
				name: space.name,
				status: space.status,
				currencyCode: space.currencyCode,
				currencySymbol: space.currencySymbol,
				allocationNeeds: space.allocationNeeds,
				allocationWants: space.allocationWants,
				allocationSavings: space.allocationSavings,
				cycleDurationDays: space.cycleDurationDays,
				cycleAnchorAt: space.cycleAnchorAt,
				premiumExpiredAt: space.premiumExpiredAt,
				closedAt: space.closedAt,
			},
			viewerRole: membership.role,
			viewerProfileId: profile._id,
			ownerIsPremium: creator.plan === "premium",
			isWritable: writable,
			canEditStructural: membership.role === "owner" && writable,
			canEditOwnGoal: writable,
			canReactivate: canReactivateSpace(space, creator),
			cycle: cycle
				? {
						_id: cycle._id,
						startDate: cycle.startDate,
						endDate: cycle.endDate,
					}
				: null,
			members: memberRows,
			pendingInvitations,
			pendingProposals: pendingProposals.map((row) => ({
				_id: row._id,
				kind: row.kind,
				payload: row.payload,
				effectiveOn: row.effectiveOn,
				status: row.status as "pending",
				proposedByProfileId: row.proposedByProfileId,
				createdAt: row.createdAt,
			})),
		};
	},
});

export const updateName = mutation({
	args: {
		spaceId: v.id("financialSpaces"),
		name: v.string(),
	},
	returns: v.null(),
	handler: async (ctx, args) => {
		await requireSpaceOwner(ctx, args.spaceId);
		await requireSpaceWritable(ctx, args.spaceId);
		const trimmed = args.name.trim();
		if (trimmed.length < 1 || trimmed.length > 80) {
			throw new ConvexError({
				code: "VALIDATION_ERROR",
				message: "El nombre del espacio debe tener entre 1 y 80 caracteres.",
			});
		}
		await ctx.db.patch(args.spaceId, { name: trimmed });
		return null;
	},
});

export const close = mutation({
	args: { spaceId: v.id("financialSpaces") },
	returns: v.null(),
	handler: async (ctx, args) => {
		await requireSpaceOwner(ctx, args.spaceId);
		await ctx.db.patch(args.spaceId, {
			status: "closed",
			closedAt: Date.now(),
		});
		return null;
	},
});

export const leave = mutation({
	args: { spaceId: v.id("financialSpaces") },
	returns: v.null(),
	handler: async (ctx, args) => {
		const { membership } = await requireSpaceMember(ctx, args.spaceId);
		if (membership.role === "owner") {
			throw new ConvexError({
				code: "FORBIDDEN",
				message: "El titular no puede abandonar; cierra el espacio.",
			});
		}
		await ctx.db.patch(membership._id, {
			status: "left",
			leftAt: Date.now(),
		});
		return null;
	},
});

export const reactivate = mutation({
	args: { spaceId: v.id("financialSpaces") },
	returns: v.null(),
	handler: async (ctx, args) => {
		const { space, creator } = await requireSpaceOwner(ctx, args.spaceId);
		if (!canReactivateSpace(space, creator)) {
			throw new ConvexError({
				code: "FORBIDDEN",
				message: "Este espacio no se puede reactivar.",
			});
		}
		await ctx.db.patch(args.spaceId, {
			status: "active",
			premiumExpiredAt: undefined,
		});
		return null;
	},
});

export const updateAllocation = mutation({
	args: {
		spaceId: v.id("financialSpaces"),
		allocationNeeds: v.number(),
		allocationWants: v.number(),
		allocationSavings: v.number(),
		effectiveOn: v.union(v.literal("current_cycle"), v.literal("next_cycle")),
	},
	returns: v.union(
		v.object({ applied: v.literal(true) }),
		v.object({
			applied: v.literal(false),
			proposalId: v.id("spaceChangeProposals"),
		}),
	),
	handler: async (ctx, args) => {
		const { membership } = await requireSpaceOwner(ctx, args.spaceId);
		if (!isValidAllocations(args.allocationNeeds, args.allocationWants, args.allocationSavings)) {
			throw new ConvexError({
				code: "VALIDATION_ERROR",
				message: "La distribución debe sumar 100% con enteros no negativos.",
			});
		}

		if (args.effectiveOn === "next_cycle") {
			await requireSpaceWritable(ctx, args.spaceId);
			await ctx.db.patch(args.spaceId, {
				allocationNeeds: args.allocationNeeds,
				allocationWants: args.allocationWants,
				allocationSavings: args.allocationSavings,
			});
			return { applied: true as const };
		}

		const proposalId = await ctx.db.insert("spaceChangeProposals", {
			spaceId: args.spaceId,
			kind: "allocation",
			payload: {
				allocationNeeds: args.allocationNeeds,
				allocationWants: args.allocationWants,
				allocationSavings: args.allocationSavings,
			},
			effectiveOn: "current_cycle",
			status: "pending",
			proposedByProfileId: membership.profileId,
			createdAt: Date.now(),
		});
		return { applied: false as const, proposalId };
	},
});
