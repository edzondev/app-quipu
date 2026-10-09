import { convexTest } from "convex-test";
import type { Id } from "./_generated/dataModel";
import schema from "./schema";

declare global {
	interface ImportMeta {
		glob(patterns: string[]): Record<string, () => Promise<unknown>>;
	}
}

// Files with several dots (tests, this helper) are not Convex modules.
const modules = import.meta.glob(["./**/*.ts", "./**/*.js", "!./**/*.*.*"]);

export const TEST_USER_ID = "user-maestro";
export const MS_PER_DAY = 24 * 60 * 60 * 1000;

export function newConvexTest() {
	return convexTest(schema, modules);
}

export type TestConvex = ReturnType<typeof newConvexTest>;

export function asTestUser(t: TestConvex) {
	return t.withIdentity({ subject: TEST_USER_ID });
}

export function seedProfile(
	t: TestConvex,
	overrides: { onboardingComplete?: boolean; plan?: "free" | "premium" } = {},
): Promise<Id<"profiles">> {
	return t.run((ctx) =>
		ctx.db.insert("profiles", {
			userId: TEST_USER_ID,
			name: "Maestro",
			country: "PE",
			currencyCode: "PEN",
			currencySymbol: "S/",
			incomeModel: "variable",
			cycleDurationDays: 15,
			allocationNeeds: 50,
			allocationWants: 30,
			allocationSavings: 20,
			onboardingComplete: overrides.onboardingComplete ?? true,
			plan: overrides.plan ?? "free",
			createdAt: 0,
			accountStatus: "active",
		}),
	);
}

export type SeededEnvelopes = { needs: number; wants: number; savings: number };

export async function seedActiveCycle(
	t: TestConvex,
	profileId: Id<"profiles">,
	input: {
		startDate: number;
		endDate: number;
		envelopes?: SeededEnvelopes;
		isOpeningCycle?: boolean;
		status?: "active" | "closed";
	},
): Promise<Id<"financialCycles">> {
	const envelopes = input.envelopes ?? { needs: 0, wants: 0, savings: 0 };
	return t.run(async (ctx) => {
		const cycleId = await ctx.db.insert("financialCycles", {
			profileId,
			startDate: input.startDate,
			endDate: input.endDate,
			status: input.status ?? "active",
			totalIncomeReceived: 0,
			...(input.isOpeningCycle ? { isOpeningCycle: true } : {}),
		});
		for (const type of ["needs", "wants", "savings"] as const) {
			await ctx.db.insert("envelopes", {
				profileId,
				cycleId,
				type,
				allocatedAmount: envelopes[type],
				remainingAmount: envelopes[type],
			});
		}
		return cycleId;
	});
}

export function envelopesOf(t: TestConvex, cycleId: Id<"financialCycles">) {
	return t.run(async (ctx) => {
		const rows = await ctx.db
			.query("envelopes")
			.withIndex("by_cycle_type", (q) => q.eq("cycleId", cycleId))
			.collect();
		return Object.fromEntries(rows.map((row) => [row.type, row])) as Record<
			"needs" | "wants" | "savings",
			(typeof rows)[number]
		>;
	});
}
