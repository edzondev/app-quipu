import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { internal } from "./_generated/api";
import betterAuthSchema from "./betterAuth/schema";
import { newConvexTest, type TestConvex } from "./convexTest.helpers";

const betterAuthModules = import.meta.glob(["./betterAuth/**/*.*s"]);

const DEV_URL = "https://perceptive-elk-229.convex.cloud";
const PROD_URL = "https://patient-chihuahua-640.convex.cloud";
const EMAIL = "maestro-sin-ciclo@example.com";

const ENV_KEYS = ["ALLOW_DEV_SEED", "CONVEX_CLOUD_URL", "DEV_SEED_PASSWORD"] as const;

function seedTest(): TestConvex {
	const t = newConvexTest();
	t.registerComponent("betterAuth", betterAuthSchema, betterAuthModules);
	return t;
}

describe("seedProfileNoCycle", () => {
	let previous: Record<(typeof ENV_KEYS)[number], string | undefined>;

	beforeEach(() => {
		previous = {
			ALLOW_DEV_SEED: process.env.ALLOW_DEV_SEED,
			CONVEX_CLOUD_URL: process.env.CONVEX_CLOUD_URL,
			DEV_SEED_PASSWORD: process.env.DEV_SEED_PASSWORD,
		};
	});

	afterEach(() => {
		for (const key of ENV_KEYS) {
			const value = previous[key];
			if (value === undefined) delete process.env[key];
			else process.env[key] = value;
		}
	});

	it("creates a verified profile and no budget cycle", async () => {
		process.env.ALLOW_DEV_SEED = "true";
		process.env.CONVEX_CLOUD_URL = DEV_URL;
		process.env.DEV_SEED_PASSWORD = "secreto-maestro";
		const t = seedTest();

		const seeded = await t.mutation(internal.devSeed.seedProfileNoCycle, { email: EMAIL });

		expect(seeded).toMatchObject({
			email: EMAIL,
			emailVerified: true,
			hasCycle: false,
		});
		const state = await t.run(async (ctx) => {
			const profile = await ctx.db.get("profiles", seeded.profileId);
			const cycles = await ctx.db
				.query("financialCycles")
				.withIndex("by_profile_status", (q) => q.eq("profileId", seeded.profileId))
				.collect();
			const funds = await ctx.db
				.query("subEnvelopes")
				.withIndex("by_profile", (q) => q.eq("profileId", seeded.profileId))
				.collect();
			const streak = await ctx.db
				.query("streaks")
				.withIndex("by_profileId", (q) => q.eq("profileId", seeded.profileId))
				.unique();
			return { profile, cycles, funds, streak };
		});
		expect(state.profile).toMatchObject({
			userId: seeded.userId,
			name: "Maestro",
			country: "Perú",
			currencyCode: "PEN",
			currencySymbol: "S/",
			incomeModel: "fixed",
			payFrequency: "monthly",
			paydays: [1],
			allocationNeeds: 50,
			allocationWants: 30,
			allocationSavings: 20,
			onboardingComplete: true,
			plan: "free",
		});
		expect(state.cycles).toHaveLength(0);
		expect(state.funds).toEqual([
			expect.objectContaining({
				label: "Fondo de Emergencia",
				currentAmount: 0,
				isSystemDefault: true,
			}),
		]);
		expect(state.streak).toMatchObject({ currentStreak: 0, longestStreak: 0 });

		await expect(
			t.mutation(internal.devSeed.seedProfileNoCycle, { email: EMAIL }),
		).rejects.toMatchObject({ data: { code: "ALREADY_EXISTS" } });
	});

	it("refuses without ALLOW_DEV_SEED", async () => {
		delete process.env.ALLOW_DEV_SEED;
		process.env.CONVEX_CLOUD_URL = DEV_URL;
		process.env.DEV_SEED_PASSWORD = "secreto-maestro";

		await expect(
			newConvexTest().mutation(internal.devSeed.seedProfileNoCycle, { email: EMAIL }),
		).rejects.toMatchObject({ data: { code: "FORBIDDEN" } });
	});

	it("refuses without DEV_SEED_PASSWORD", async () => {
		process.env.ALLOW_DEV_SEED = "true";
		process.env.CONVEX_CLOUD_URL = DEV_URL;
		delete process.env.DEV_SEED_PASSWORD;

		await expect(
			newConvexTest().mutation(internal.devSeed.seedProfileNoCycle, { email: EMAIL }),
		).rejects.toMatchObject({ data: { code: "FORBIDDEN" } });
	});

	it("refuses the production deployment", async () => {
		process.env.ALLOW_DEV_SEED = "true";
		process.env.CONVEX_CLOUD_URL = PROD_URL;
		process.env.DEV_SEED_PASSWORD = "secreto-maestro";

		await expect(
			newConvexTest().mutation(internal.devSeed.seedProfileNoCycle, { email: EMAIL }),
		).rejects.toMatchObject({ data: { code: "FORBIDDEN" } });
	});
});
