import { ConvexError, v } from "convex/values";
import type { Doc, Id } from "./_generated/dataModel";
import type { MutationCtx } from "./_generated/server";
import { mutation, query } from "./_generated/server";
import { requireSpaceMember, requireSpaceWritable } from "./lib/spaceAuth";
import {
	canProposeChange,
	canRespondToProposal,
	shouldRequireDualConfirmation,
} from "./lib/spaceChangeProposalLogic";

const proposalValidator = v.object({
	_id: v.id("spaceChangeProposals"),
	kind: v.union(
		v.literal("allocation"),
		v.literal("cycle_duration"),
		v.literal("expected_contribution"),
	),
	payload: v.any(),
	effectiveOn: v.union(v.literal("current_cycle"), v.literal("next_cycle")),
	status: v.union(v.literal("pending"), v.literal("approved"), v.literal("rejected")),
	proposedByProfileId: v.id("profiles"),
	createdAt: v.number(),
});

async function applyProposal(
	ctx: MutationCtx,
	proposal: Pick<Doc<"spaceChangeProposals">, "spaceId" | "kind" | "payload">,
) {
	const space = await ctx.db.get("financialSpaces", proposal.spaceId);
	if (!space) return;

	if (proposal.kind === "allocation") {
		const payload = proposal.payload as {
			allocationNeeds: number;
			allocationWants: number;
			allocationSavings: number;
		};
		await ctx.db.patch(space._id, {
			allocationNeeds: payload.allocationNeeds,
			allocationWants: payload.allocationWants,
			allocationSavings: payload.allocationSavings,
		});
		return;
	}

	if (proposal.kind === "cycle_duration") {
		const payload = proposal.payload as { cycleDurationDays: number };
		await ctx.db.patch(space._id, {
			cycleDurationDays: payload.cycleDurationDays,
		});
		return;
	}

	const payload = proposal.payload as {
		profileId: Id<"profiles">;
		expectedContributionCents: number;
	};
	const membership = await ctx.db
		.query("spaceMembers")
		.withIndex("by_space_profile", (q) =>
			q.eq("spaceId", space._id).eq("profileId", payload.profileId),
		)
		.unique();
	if (membership) {
		await ctx.db.patch(membership._id, {
			expectedContributionCents: payload.expectedContributionCents,
		});
	}
}

async function createProposalInternal(
	ctx: MutationCtx,
	args: {
		spaceId: Id<"financialSpaces">;
		kind: Doc<"spaceChangeProposals">["kind"];
		payload: unknown;
		effectiveOn: Doc<"spaceChangeProposals">["effectiveOn"];
	},
): Promise<Id<"spaceChangeProposals"> | null> {
	const { profile, membership } = await requireSpaceMember(ctx, args.spaceId);
	const payload = args.payload as Record<string, unknown>;
	const targetProfileId = payload.profileId as Id<"profiles"> | undefined;

	if (
		!canProposeChange({
			role: membership.role,
			kind: args.kind,
			targetProfileId,
			callerProfileId: profile._id,
		})
	) {
		throw new ConvexError({
			code: "FORBIDDEN",
			message: "No puedes proponer este cambio.",
		});
	}

	if (!shouldRequireDualConfirmation(args.effectiveOn)) {
		await requireSpaceWritable(ctx, args.spaceId);
		await applyProposal(ctx, {
			spaceId: args.spaceId,
			kind: args.kind,
			payload: args.payload,
		});
		return null;
	}

	return await ctx.db.insert("spaceChangeProposals", {
		spaceId: args.spaceId,
		kind: args.kind,
		payload: args.payload,
		effectiveOn: args.effectiveOn,
		status: "pending",
		proposedByProfileId: profile._id,
		createdAt: Date.now(),
	});
}

export const create = mutation({
	args: {
		spaceId: v.id("financialSpaces"),
		kind: v.union(
			v.literal("allocation"),
			v.literal("cycle_duration"),
			v.literal("expected_contribution"),
		),
		payload: v.any(),
		effectiveOn: v.union(v.literal("current_cycle"), v.literal("next_cycle")),
	},
	returns: v.union(v.id("spaceChangeProposals"), v.null()),
	handler: async (ctx, args) => createProposalInternal(ctx, args),
});

export const respond = mutation({
	args: {
		proposalId: v.id("spaceChangeProposals"),
		decision: v.union(v.literal("approve"), v.literal("reject")),
	},
	returns: v.null(),
	handler: async (ctx, args) => {
		const proposal = await ctx.db.get("spaceChangeProposals", args.proposalId);
		if (proposal?.status !== "pending") {
			throw new ConvexError({
				code: "NOT_FOUND",
				message: "Propuesta no encontrada.",
			});
		}

		const { profile } = await requireSpaceMember(ctx, proposal.spaceId);
		if (
			!canRespondToProposal({
				proposedByProfileId: proposal.proposedByProfileId,
				responderProfileId: profile._id,
			})
		) {
			throw new ConvexError({
				code: "FORBIDDEN",
				message: "No puedes responder tu propia propuesta.",
			});
		}

		const now = Date.now();
		if (args.decision === "reject") {
			await ctx.db.patch(proposal._id, {
				status: "rejected",
				respondedByProfileId: profile._id,
				respondedAt: now,
			});
			return null;
		}

		await requireSpaceWritable(ctx, proposal.spaceId);
		await applyProposal(ctx, proposal);
		await ctx.db.patch(proposal._id, {
			status: "approved",
			respondedByProfileId: profile._id,
			respondedAt: now,
		});
		return null;
	},
});

export const listPending = query({
	args: { spaceId: v.id("financialSpaces") },
	returns: v.array(proposalValidator),
	handler: async (ctx, args) => {
		await requireSpaceMember(ctx, args.spaceId);
		const rows = await ctx.db
			.query("spaceChangeProposals")
			.withIndex("by_space_status", (q) => q.eq("spaceId", args.spaceId).eq("status", "pending"))
			.collect();
		return rows.map((row) => ({
			_id: row._id,
			kind: row.kind,
			payload: row.payload,
			effectiveOn: row.effectiveOn,
			status: row.status,
			proposedByProfileId: row.proposedByProfileId,
			createdAt: row.createdAt,
		}));
	},
});

export const updateExpectedContribution = mutation({
	args: {
		spaceId: v.id("financialSpaces"),
		profileId: v.id("profiles"),
		expectedContributionCents: v.number(),
		effectiveOn: v.union(v.literal("current_cycle"), v.literal("next_cycle")),
	},
	returns: v.union(v.id("spaceChangeProposals"), v.null()),
	handler: async (ctx, args) => {
		const { profile, membership } = await requireSpaceMember(ctx, args.spaceId);
		if (!Number.isInteger(args.expectedContributionCents) || args.expectedContributionCents < 0) {
			throw new ConvexError({
				code: "VALIDATION_ERROR",
				message: "La meta debe ser un entero no negativo.",
			});
		}

		const targetProfileId = membership.role === "member" ? profile._id : args.profileId;

		return await createProposalInternal(ctx, {
			spaceId: args.spaceId,
			kind: "expected_contribution",
			payload: {
				profileId: targetProfileId,
				expectedContributionCents: args.expectedContributionCents,
			},
			effectiveOn: args.effectiveOn,
		});
	},
});
