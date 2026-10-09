import { beforeEach, describe, expect, it, vi } from "vitest";
import {
	computeCycleCarryover,
	envelopeWithCarry,
	signedCycleSurplusCents,
} from "./lib/cycleCarryover";
import { isCyclePastEnd } from "./lib/dashboardMath";
import { resolveCycleForIncome } from "./lib/incomeEventLogic";

vi.mock("./_generated/server", () => ({
	mutation: (definition: { handler: unknown }) => definition,
	query: (definition: { handler: unknown }) => definition,
}));

type Row = Record<string, unknown> & { _id: string };

const tables: Record<string, Row[]> = {
	profiles: [],
	financialCycles: [],
	envelopes: [],
	expenses: [],
};

function resetTables() {
	for (const name of Object.keys(tables)) {
		tables[name] = [];
	}
}

function matches(row: Row, filters: Array<[string, unknown]>) {
	return filters.every(([field, value]) => row[field] === value);
}

const ctx = {
	auth: {
		getUserIdentity: async () => ({ subject: "user-maestro" }),
	},
	db: {
		query(table: string) {
			return {
				withIndex(
					_name: string,
					build: (q: { eq: (field: string, value: unknown) => unknown }) => void,
				) {
					const filters: Array<[string, unknown]> = [];
					const q = {
						eq(field: string, value: unknown) {
							filters.push([field, value]);
							return q;
						},
					};
					build(q);
					return {
						unique: async () => tables[table]?.find((row) => matches(row, filters)) ?? null,
					};
				},
			};
		},
		async insert(table: string, doc: Record<string, unknown>) {
			const _id = `${table}-${(tables[table]?.length ?? 0) + 1}`;
			tables[table]?.push({ ...doc, _id });
			return _id;
		},
		async patch(id: string, update: Record<string, unknown>) {
			for (const rows of Object.values(tables)) {
				const row = rows.find((item) => item._id === id);
				if (row) Object.assign(row, update);
			}
		},
		async get(id: string) {
			for (const rows of Object.values(tables)) {
				const row = rows.find((item) => item._id === id);
				if (row) return row;
			}
			return null;
		},
	},
};

type ExpenseHandler = (
	db: {
		auth: { getUserIdentity: () => Promise<{ subject: string }> };
		db: {
			query: (table: string) => {
				withIndex: (
					name: string,
					build: (q: { eq: (field: string, value: unknown) => unknown }) => void,
				) => { unique: () => Promise<Row | null> };
			};
			insert: (table: string, doc: Record<string, unknown>) => Promise<string>;
			patch: (id: string, update: Record<string, unknown>) => Promise<void>;
			get: (id: string) => Promise<Row | null>;
		};
	},
	args: { amount: number; description: string; envelopeType: "needs" },
) => Promise<{
	expenseId: string;
	remainingAmount: number;
	cycleId: string;
}>;

describe("registerExpense after the pay date", () => {
	beforeEach(() => {
		resetTables();
		vi.resetModules();
	});

	it("keeps the expense on the expired active cycle and that leftover carries once", async () => {
		const { registerExpense } = await import("./expenses");
		const handler = (registerExpense as unknown as { handler: ExpenseHandler }).handler;
		const now = Date.now();
		const endDate = now - 60_000;
		const startDate = endDate - 30 * 24 * 60 * 60 * 1000;
		const needsBefore = 10_000;
		const expense = 1_500;

		const profileId = await ctx.db.insert("profiles", {
			userId: "user-maestro",
			name: "Maestro",
			accountStatus: "active",
			_id: "",
		});
		const cycleId = await ctx.db.insert("financialCycles", {
			profileId,
			startDate,
			endDate,
			status: "active",
			_id: "",
		});
		await ctx.db.insert("envelopes", {
			profileId,
			cycleId,
			type: "needs",
			allocatedAmount: needsBefore,
			remainingAmount: needsBefore,
			_id: "",
		});

		const result = await handler(ctx, {
			amount: expense,
			description: "pan",
			envelopeType: "needs",
		});

		expect(result.cycleId).toBe(cycleId);
		expect(result.remainingAmount).toBe(needsBefore - expense);
		const stored = await ctx.db.get(result.expenseId);
		const cycle = await ctx.db.get(cycleId);
		expect(typeof stored?.timestamp).toBe("number");
		expect((stored?.timestamp as number) > endDate).toBe(true);
		expect(isCyclePastEnd(endDate, stored?.timestamp as number)).toBe(true);
		expect(cycle?.status).toBe("active");

		expect(
			resolveCycleForIncome({
				activeCycle: { _id: cycleId, startDate, endDate },
				occurredAt: stored?.timestamp as number,
				now: stored?.timestamp as number,
				incomeKind: "habitual",
			}),
		).toBeNull();

		const carry = computeCycleCarryover({
			envelopes: [
				{ type: "needs", remainingAmount: result.remainingAmount },
				{ type: "wants", remainingAmount: 0 },
				{ type: "savings", remainingAmount: 0 },
			],
			closeSurplusMovedAt: undefined,
			surplusContributions: [],
			incomeEvents: [],
		});
		expect(carry.needs).toBe(needsBefore - expense);
		expect(envelopeWithCarry(0, carry.needs).carriedOverCents).toBe(needsBefore - expense);
		expect(signedCycleSurplusCents(carry)).toBe(needsBefore - expense);
		expect(signedCycleSurplusCents(carry)).not.toBe(needsBefore - expense * 2);
	});
});
