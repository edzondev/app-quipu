import { v } from "convex/values";
import type { Doc, Id } from "./_generated/dataModel";
import { query } from "./_generated/server";
import { getActiveSpaceCycle, requireSpaceMember } from "./lib/spaceAuth";
import { buildSpaceMovements } from "./spaceMovements";

const MOVEMENTS_LIST_LIMIT = 500;

function envelopeLabel(type: "needs" | "wants" | "savings"): string {
	switch (type) {
		case "needs":
			return "Necesidades";
		case "wants":
			return "Gustos";
		case "savings":
			return "Ahorro";
	}
}

export const listForActiveCycle = query({
	args: {},
	handler: async (ctx) => {
		const identity = await ctx.auth.getUserIdentity();
		if (!identity) return null;

		const profile = await ctx.db
			.query("profiles")
			.withIndex("by_userId", (q) => q.eq("userId", identity.subject))
			.unique();
		if (!profile) return null;

		const activeCycle = await ctx.db
			.query("financialCycles")
			.withIndex("by_profile_status", (q) => q.eq("profileId", profile._id).eq("status", "active"))
			.unique();

		if (!activeCycle) {
			return {
				currencyCode: profile.currencyCode,
				cycle: null,
				movements: [] as ReturnType<typeof buildMovements>,
			};
		}

		const envelopesRaw = await ctx.db
			.query("envelopes")
			.withIndex("by_cycle_type", (q) => q.eq("cycleId", activeCycle._id))
			.collect();

		const envelopeTypeById = new Map<Id<"envelopes">, Doc<"envelopes">["type"]>(
			envelopesRaw.map((envelope) => [envelope._id, envelope.type]),
		);

		const [expensesRaw, incomesRaw] = await Promise.all([
			ctx.db
				.query("expenses")
				.withIndex("by_cycle_envelope_time", (q) => q.eq("cycleId", activeCycle._id))
				.order("desc")
				.collect(),
			ctx.db
				.query("incomeEvents")
				.withIndex("by_cycle", (q) => q.eq("cycleId", activeCycle._id))
				.collect(),
		]);

		const movements = buildMovements(
			expensesRaw,
			incomesRaw,
			envelopeTypeById,
			MOVEMENTS_LIST_LIMIT,
		);

		return {
			currencyCode: profile.currencyCode,
			cycle: {
				startDate: activeCycle.startDate,
				endDate: activeCycle.endDate,
			},
			movements,
		};
	},
});

function buildMovements(
	expenses: Doc<"expenses">[],
	incomes: Doc<"incomeEvents">[],
	envelopeTypeById: Map<Id<"envelopes">, Doc<"envelopes">["type"]>,
	limit: number,
) {
	type ExpenseRow = {
		id: string;
		kind: "expense";
		label: string;
		envelopeLabel?: string;
		amount: number;
		timestamp: number;
		isExtraordinaryIncome?: false;
		envelopeType?: "needs" | "wants";
	};

	type IncomeRow = {
		id: string;
		kind: "income";
		label: string;
		amount: number;
		timestamp: number;
		isExtraordinaryIncome?: boolean;
		appliedByAutoRule?: boolean;
		occurredAt: number;
		source: Doc<"incomeEvents">["source"];
		incomeKind?: "habitual" | "extraordinary";
		extraordinaryType?: Doc<"incomeEvents">["extraordinaryType"];
		extraordinaryLabel?: string;
		distributionPolicy?: Doc<"incomeEvents">["distributionPolicy"];
	};

	const expenseRows: ExpenseRow[] = expenses.map((expense) => {
		const type = envelopeTypeById.get(expense.envelopeId);
		return {
			id: expense._id,
			kind: "expense",
			label: expense.description,
			envelopeLabel: type ? envelopeLabel(type) : undefined,
			amount: expense.amount,
			timestamp: expense.timestamp,
			envelopeType: type === "needs" || type === "wants" ? type : undefined,
		};
	});

	const incomeRows: IncomeRow[] = incomes.map((income) => ({
		id: income._id,
		kind: "income",
		label: income.description,
		amount: income.amount,
		timestamp: income.occurredAt,
		isExtraordinaryIncome: income.incomeKind === "extraordinary",
		appliedByAutoRule: income.appliedByAutoRule,
		occurredAt: income.occurredAt,
		source: income.source,
		incomeKind: income.incomeKind,
		extraordinaryType: income.extraordinaryType,
		extraordinaryLabel: income.extraordinaryLabel,
		distributionPolicy: income.distributionPolicy,
	}));

	return [...expenseRows, ...incomeRows].sort((a, b) => b.timestamp - a.timestamp).slice(0, limit);
}

const contextValidator = v.union(
	v.literal("personal"),
	v.object({
		type: v.literal("space"),
		spaceId: v.id("financialSpaces"),
	}),
);

const incomeSourceValidator = v.union(
	v.literal("payroll"),
	v.literal("freelance"),
	v.literal("business"),
	v.literal("gift"),
	v.literal("refund"),
	v.literal("investment"),
	v.literal("other"),
);

const movementListItemValidator = v.object({
	id: v.string(),
	kind: v.union(v.literal("expense"), v.literal("income"), v.literal("contribution")),
	label: v.string(),
	amount: v.number(),
	timestamp: v.number(),
	envelopeLabel: v.optional(v.string()),
	envelopeType: v.optional(v.union(v.literal("needs"), v.literal("wants"))),
	fundingSource: v.optional(v.union(v.literal("space_budget"), v.literal("personal_pocket"))),
	isExtraordinaryIncome: v.optional(v.boolean()),
	appliedByAutoRule: v.optional(v.boolean()),
	occurredAt: v.optional(v.number()),
	source: v.optional(incomeSourceValidator),
	incomeKind: v.optional(v.union(v.literal("habitual"), v.literal("extraordinary"))),
});

export const listForContext = query({
	args: { context: contextValidator },
	returns: v.union(
		v.null(),
		v.object({
			currencyCode: v.string(),
			contextLabel: v.string(),
			cycle: v.union(
				v.null(),
				v.object({
					startDate: v.number(),
					endDate: v.number(),
				}),
			),
			movements: v.array(movementListItemValidator),
		}),
	),
	handler: async (ctx, args) => {
		const identity = await ctx.auth.getUserIdentity();
		if (!identity) return null;

		const profile = await ctx.db
			.query("profiles")
			.withIndex("by_userId", (q) => q.eq("userId", identity.subject))
			.unique();
		if (!profile) return null;

		if (args.context === "personal") {
			const activeCycle = await ctx.db
				.query("financialCycles")
				.withIndex("by_profile_status", (q) =>
					q.eq("profileId", profile._id).eq("status", "active"),
				)
				.unique();

			if (!activeCycle) {
				return {
					currencyCode: profile.currencyCode,
					contextLabel: "Personal",
					cycle: null,
					movements: [],
				};
			}

			const envelopesRaw = await ctx.db
				.query("envelopes")
				.withIndex("by_cycle_type", (q) => q.eq("cycleId", activeCycle._id))
				.collect();

			const envelopeTypeById = new Map<Id<"envelopes">, Doc<"envelopes">["type"]>(
				envelopesRaw.map((envelope) => [envelope._id, envelope.type]),
			);

			const [expensesRaw, incomesRaw] = await Promise.all([
				ctx.db
					.query("expenses")
					.withIndex("by_cycle_envelope_time", (q) => q.eq("cycleId", activeCycle._id))
					.order("desc")
					.collect(),
				ctx.db
					.query("incomeEvents")
					.withIndex("by_cycle", (q) => q.eq("cycleId", activeCycle._id))
					.collect(),
			]);

			const movements = buildMovements(
				expensesRaw,
				incomesRaw,
				envelopeTypeById,
				MOVEMENTS_LIST_LIMIT,
			);

			return {
				currencyCode: profile.currencyCode,
				contextLabel: "Personal",
				cycle: {
					startDate: activeCycle.startDate,
					endDate: activeCycle.endDate,
				},
				movements,
			};
		}

		const { space } = await requireSpaceMember(ctx, args.context.spaceId);
		const cycle = await getActiveSpaceCycle(ctx, space._id);
		if (!cycle) {
			return {
				currencyCode: space.currencyCode,
				contextLabel: space.name,
				cycle: null,
				movements: [],
			};
		}

		const [expenses, contributions] = await Promise.all([
			ctx.db
				.query("spaceExpenses")
				.withIndex("by_space_cycle_time", (q) =>
					q.eq("spaceId", space._id).eq("cycleId", cycle._id),
				)
				.order("desc")
				.collect(),
			ctx.db
				.query("spaceContributions")
				.withIndex("by_cycle", (q) => q.eq("cycleId", cycle._id))
				.collect(),
		]);

		return {
			currencyCode: space.currencyCode,
			contextLabel: space.name,
			cycle: {
				startDate: cycle.startDate,
				endDate: cycle.endDate,
			},
			movements: buildSpaceMovements(expenses, contributions),
		};
	},
});
