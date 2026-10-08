import { ConvexError, type Infer, v } from "convex/values";
import type { Doc, Id } from "./_generated/dataModel";
import type { MutationCtx, QueryCtx } from "./_generated/server";
import { mutation, query } from "./_generated/server";
import {
	type ClosedCycleSurplusTotals,
	computeClosedCycleSurplusTotals,
	isOwnedSavingsSubEnvelope,
	isSurplusDecided,
	listEnvelopesWithSurplus,
} from "./lib/closedCycleSurplusMath";
import { creditSubEnvelopeFromSurplus } from "./lib/creditSurplusContribution";
import {
	closedCycleSurplusDestinationValidator,
	type SurplusFromEnvelope,
	surplusFromEnvelopeValidator,
} from "./lib/surplusValidators";

const surplusAssignmentDestinationValidator = v.union(
	v.object({
		kind: v.literal("subEnvelope"),
		subEnvelopeId: v.id("subEnvelopes"),
		name: v.string(),
	}),
	v.object({
		kind: v.literal("leave"),
	}),
);

const closedCycleSurplusEnvelopeValidator = v.object({
	fromEnvelope: surplusFromEnvelopeValidator,
	total: v.number(),
	available: v.number(),
});

const savingsSubEnvelopeChoiceValidator = v.object({
	id: v.id("subEnvelopes"),
	name: v.string(),
	currentAmount: v.number(),
	isSystemDefault: v.boolean(),
});

const closedCycleSurplusAssignmentValidator = v.object({
	fromEnvelope: surplusFromEnvelopeValidator,
	destination: surplusAssignmentDestinationValidator,
	amount: v.number(),
});

const closedCycleSurplusResultValidator = v.union(
	v.null(),
	v.object({
		closedCycleId: v.id("financialCycles"),
		envelopes: v.array(closedCycleSurplusEnvelopeValidator),
		savingsSubEnvelopes: v.array(savingsSubEnvelopeChoiceValidator),
		assignments: v.array(closedCycleSurplusAssignmentValidator),
		decided: v.boolean(),
	}),
);

const assignClosedCycleSurplusResultValidator = v.null();

function compareSavingsSubEnvelopes(
	a: { isSystemDefault: boolean; label: string },
	b: { isSystemDefault: boolean; label: string },
): number {
	if (a.isSystemDefault !== b.isSystemDefault) {
		return a.isSystemDefault ? -1 : 1;
	}
	return a.label.localeCompare(b.label, "es");
}

function pickLatestClosedCycle(
	cycles: ReadonlyArray<Doc<"financialCycles">>,
): Doc<"financialCycles"> | null {
	let latest: Doc<"financialCycles"> | null = null;
	for (const cycle of cycles) {
		if (latest === null) {
			latest = cycle;
			continue;
		}
		if (cycle.endDate !== latest.endDate) {
			if (cycle.endDate > latest.endDate) latest = cycle;
			continue;
		}
		if (cycle.startDate !== latest.startDate) {
			if (cycle.startDate > latest.startDate) latest = cycle;
			continue;
		}
		if (cycle._creationTime > latest._creationTime) latest = cycle;
	}
	return latest;
}

async function loadClosedCycleSurplus(
	ctx: QueryCtx | MutationCtx,
	cycleId: Id<"financialCycles">,
): Promise<{
	totals: ClosedCycleSurplusTotals;
	dispositions: Doc<"closedCycleSurplusDispositions">[];
}> {
	const [needs, wants, savings, incomeEvents, contributions, dispositions] = await Promise.all([
		ctx.db
			.query("envelopes")
			.withIndex("by_cycle_type", (q) => q.eq("cycleId", cycleId).eq("type", "needs"))
			.unique(),
		ctx.db
			.query("envelopes")
			.withIndex("by_cycle_type", (q) => q.eq("cycleId", cycleId).eq("type", "wants"))
			.unique(),
		ctx.db
			.query("envelopes")
			.withIndex("by_cycle_type", (q) => q.eq("cycleId", cycleId).eq("type", "savings"))
			.unique(),
		ctx.db
			.query("incomeEvents")
			.withIndex("by_cycle", (q) => q.eq("cycleId", cycleId))
			.collect(),
		ctx.db
			.query("surplusContributions")
			.withIndex("by_cycle", (q) => q.eq("cycleId", cycleId))
			.collect(),
		ctx.db
			.query("closedCycleSurplusDispositions")
			.withIndex("by_cycle", (q) => q.eq("closedCycleId", cycleId))
			.collect(),
	]);

	let extraordinaryContributionCents = 0;
	for (const row of contributions) {
		if (row.fromEnvelope !== "extraordinary") continue;
		extraordinaryContributionCents += Math.max(0, row.amount);
	}

	const totals = computeClosedCycleSurplusTotals({
		needsRemainingCents: needs?.remainingAmount ?? 0,
		wantsRemainingCents: wants?.remainingAmount ?? 0,
		savingsRemainingCents: savings?.remainingAmount ?? 0,
		incomeEvents: incomeEvents.map((event) => ({
			incomeKind: event.incomeKind,
			distributionApplied: event.distributionApplied,
		})),
		extraordinaryContributionCents,
		dispositions: dispositions.map((row) => ({
			fromEnvelope: row.fromEnvelope,
			amount: row.amount,
			destinationKind: row.destination.kind,
		})),
	});

	return { totals, dispositions };
}

export const getClosedCycleSurplus = query({
	args: {},
	returns: closedCycleSurplusResultValidator,
	handler: async (ctx): Promise<Infer<typeof closedCycleSurplusResultValidator>> => {
		const identity = await ctx.auth.getUserIdentity();
		if (!identity) return null;

		const profile = await ctx.db
			.query("profiles")
			.withIndex("by_userId", (q) => q.eq("userId", identity.subject))
			.unique();
		if (!profile) return null;

		const closedCycles = await ctx.db
			.query("financialCycles")
			.withIndex("by_profile_status", (q) => q.eq("profileId", profile._id).eq("status", "closed"))
			.collect();
		const closedCycle = pickLatestClosedCycle(closedCycles);
		if (!closedCycle) return null;

		const [{ totals, dispositions }, subEnvelopes] = await Promise.all([
			loadClosedCycleSurplus(ctx, closedCycle._id),
			ctx.db
				.query("subEnvelopes")
				.withIndex("by_profile", (q) => q.eq("profileId", profile._id))
				.collect(),
		]);

		const savingsSubEnvelopes = subEnvelopes
			.filter((subEnvelope) => {
				const parentType: string = subEnvelope.parentEnvelopeType;
				return parentType === "savings";
			})
			.sort(compareSavingsSubEnvelopes)
			.map((subEnvelope) => ({
				id: subEnvelope._id,
				name: subEnvelope.label,
				currentAmount: subEnvelope.currentAmount,
				isSystemDefault: subEnvelope.isSystemDefault,
			}));

		const subById = new Map(subEnvelopes.map((subEnvelope) => [subEnvelope._id, subEnvelope]));
		const orderedDispositions = dispositions.slice().sort((a, b) => {
			if (a.createdAt !== b.createdAt) return a.createdAt - b.createdAt;
			return a._creationTime - b._creationTime;
		});

		const assignments: Infer<typeof closedCycleSurplusAssignmentValidator>[] = [];
		for (const row of orderedDispositions) {
			if (row.destination.kind === "leave") {
				assignments.push({
					fromEnvelope: row.fromEnvelope,
					destination: { kind: "leave" },
					amount: row.amount,
				});
				continue;
			}
			const cached = subById.get(row.destination.subEnvelopeId);
			const subEnvelope =
				cached !== undefined
					? cached
					: await ctx.db.get("subEnvelopes", row.destination.subEnvelopeId);
			assignments.push({
				fromEnvelope: row.fromEnvelope,
				destination: {
					kind: "subEnvelope",
					subEnvelopeId: row.destination.subEnvelopeId,
					name: subEnvelope ? subEnvelope.label : "",
				},
				amount: row.amount,
			});
		}

		const envelopes = listEnvelopesWithSurplus(totals);
		return {
			closedCycleId: closedCycle._id,
			envelopes,
			savingsSubEnvelopes,
			assignments,
			decided: isSurplusDecided(envelopes),
		};
	},
});

export const assignClosedCycleSurplus = mutation({
	args: {
		closedCycleId: v.id("financialCycles"),
		fromEnvelope: surplusFromEnvelopeValidator,
		allocations: v.array(
			v.object({
				destination: closedCycleSurplusDestinationValidator,
				amount: v.number(),
			}),
		),
	},
	returns: assignClosedCycleSurplusResultValidator,
	handler: async (ctx, args): Promise<Infer<typeof assignClosedCycleSurplusResultValidator>> => {
		const identity = await ctx.auth.getUserIdentity();
		if (!identity) {
			throw new ConvexError({
				code: "UNAUTHORIZED",
				message: "Debes iniciar sesión para asignar el sobrante.",
			});
		}

		const profile = await ctx.db
			.query("profiles")
			.withIndex("by_userId", (q) => q.eq("userId", identity.subject))
			.unique();
		if (!profile) {
			throw new ConvexError({
				code: "NOT_FOUND",
				message: "No encontramos tu perfil.",
			});
		}

		const cycle = await ctx.db.get("financialCycles", args.closedCycleId);
		if (!cycle || cycle.profileId !== profile._id) {
			throw new ConvexError({
				code: "NOT_FOUND",
				message: "No encontramos ese ciclo cerrado.",
			});
		}
		if (cycle.status !== "closed") {
			throw new ConvexError({
				code: "VALIDATION_ERROR",
				message: "Solo puedes asignar el sobrante de un ciclo cerrado.",
			});
		}

		if (args.allocations.length === 0) {
			throw new ConvexError({
				code: "VALIDATION_ERROR",
				message: "Indica al menos un destino para el sobrante.",
			});
		}

		let requested = 0;
		for (const allocation of args.allocations) {
			if (!Number.isInteger(allocation.amount) || allocation.amount <= 0) {
				throw new ConvexError({
					code: "VALIDATION_ERROR",
					message: "Cada monto debe ser un entero de céntimos mayor a cero.",
					data: { field: "amount" },
				});
			}
			requested += allocation.amount;
		}

		const { totals } = await loadClosedCycleSurplus(ctx, cycle._id);
		const available = totals[args.fromEnvelope].available;
		if (requested > available) {
			throw new ConvexError({
				code: "INSUFFICIENT_ENVELOPE_BALANCE",
				message: "La suma supera el sobrante disponible de ese sobre.",
				data: {
					envelope: args.fromEnvelope,
					requested,
					available,
				},
			});
		}

		const subEnvelopeIds: Id<"subEnvelopes">[] = [];
		for (const allocation of args.allocations) {
			if (allocation.destination.kind === "subEnvelope") {
				subEnvelopeIds.push(allocation.destination.subEnvelopeId);
			}
		}
		const subEnvelopeDocs = await Promise.all(
			subEnvelopeIds.map((subEnvelopeId) => ctx.db.get("subEnvelopes", subEnvelopeId)),
		);
		for (const subEnvelope of subEnvelopeDocs) {
			if (!isOwnedSavingsSubEnvelope(subEnvelope, profile._id)) {
				throw new ConvexError({
					code: "NOT_FOUND",
					message: "Esa meta no es un sub-sobre de ahorro tuyo.",
				});
			}
		}

		const fromEnvelope: SurplusFromEnvelope = args.fromEnvelope;
		const now = Date.now();
		for (const allocation of args.allocations) {
			if (allocation.destination.kind === "subEnvelope") {
				await creditSubEnvelopeFromSurplus(ctx, {
					profileId: profile._id,
					cycleId: cycle._id,
					fromEnvelope,
					amount: allocation.amount,
					subEnvelopeId: allocation.destination.subEnvelopeId,
					createdAt: now,
				});
			}
			await ctx.db.insert("closedCycleSurplusDispositions", {
				profileId: profile._id,
				closedCycleId: cycle._id,
				fromEnvelope,
				amount: allocation.amount,
				destination: allocation.destination,
				createdAt: now,
			});
		}

		return null;
	},
});
