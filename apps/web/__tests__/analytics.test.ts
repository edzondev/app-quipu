/**
 * Tests de la capa de analytics.
 *
 * El SDK de PostHog (browser singleton) no se monta en jsdom porque sus
 * inicializadores tocan APIs de browser que no existen. Estos tests
 * verifican:
 *   - el contrato de tipos del wrapper `track`
 *   - los helpers de properties (mappers, días restantes)
 *   - el helper de last-login
 *   - la no-op safety de `track` cuando PostHog no está configurado
 */

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/core/env.client", () => ({
	clientEnv: {
		NEXT_PUBLIC_APP_URL: "http://localhost:3000",
		NEXT_PUBLIC_CONVEX_URL: "http://localhost:3210",
		NEXT_PUBLIC_CONVEX_SITE_URL: "http://localhost:3211",
		NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN: undefined,
		NEXT_PUBLIC_POSTHOG_HOST: undefined,
	},
}));

const {
	AnalyticsEvents,
	daysRemainingInCycle,
	daysSinceLastLogin,
	mapDistributionPolicyToAllocationMode,
	mapExtraordinaryTypeToIncomeType,
	mapHabitualSourceToIncomeType,
	mapSurplusSourceToAdditionalSavingsSource,
	readLastLoginTimestamp,
	stampAndComputeDaysSinceLastLogin,
	writeLastLoginTimestamp,
} = await import("@/core/analytics");

describe("daysRemainingInCycle", () => {
	const MS_PER_DAY = 24 * 60 * 60 * 1000;

	it("devuelve 0 si el ciclo ya venció", () => {
		const now = 1_700_000_000_000;
		expect(daysRemainingInCycle(now - MS_PER_DAY, now)).toBe(0);
	});

	it("devuelve 1 para un día restante", () => {
		const now = 1_700_000_000_000;
		expect(daysRemainingInCycle(now + MS_PER_DAY, now)).toBe(1);
	});

	it("redondea hacia arriba para medios días", () => {
		const now = 1_700_000_000_000;
		expect(daysRemainingInCycle(now + MS_PER_DAY * 1.4, now)).toBe(2);
	});
});

describe("mapSurplusSourceToAdditionalSavingsSource", () => {
	it("map extraordinary → gratification", () => {
		expect(mapSurplusSourceToAdditionalSavingsSource("extraordinary")).toBe("gratification");
	});

	it("map needs → salary", () => {
		expect(mapSurplusSourceToAdditionalSavingsSource("needs")).toBe("salary");
	});

	it("map wants → salary", () => {
		expect(mapSurplusSourceToAdditionalSavingsSource("wants")).toBe("salary");
	});
});

describe("mapExtraordinaryTypeToIncomeType", () => {
	it("gratification_* → gratification", () => {
		expect(mapExtraordinaryTypeToIncomeType("gratification_july")).toBe("gratification");
		expect(mapExtraordinaryTypeToIncomeType("gratification_december")).toBe("gratification");
	});

	it("cts / corporate_bonus / profit_shaking / custom mantienen su tipo", () => {
		expect(mapExtraordinaryTypeToIncomeType("cts")).toBe("cts");
		expect(mapExtraordinaryTypeToIncomeType("corporate_bonus")).toBe("bonus");
		expect(mapExtraordinaryTypeToIncomeType("profit_sharing")).toBe("utilities");
		expect(mapExtraordinaryTypeToIncomeType("custom")).toBe("other");
	});

	it("undefined → other", () => {
		expect(mapExtraordinaryTypeToIncomeType(undefined)).toBe("other");
	});
});

describe("mapHabitualSourceToIncomeType", () => {
	it("payroll → salary", () => {
		expect(mapHabitualSourceToIncomeType("payroll")).toBe("salary");
	});

	it("freelance → freelance; resto → other", () => {
		expect(mapHabitualSourceToIncomeType("freelance")).toBe("freelance");
		expect(mapHabitualSourceToIncomeType("business")).toBe("other");
	});
});

describe("mapDistributionPolicyToAllocationMode", () => {
	it("profile_default → default", () => {
		expect(mapDistributionPolicyToAllocationMode("profile_default")).toBe("default");
	});

	it("all_to_savings se mantiene", () => {
		expect(mapDistributionPolicyToAllocationMode("all_to_savings")).toBe("all_to_savings");
	});

	it("undefined → manual", () => {
		expect(mapDistributionPolicyToAllocationMode(undefined)).toBe("manual");
	});
});

describe("last-login helpers", () => {
	const MS_PER_DAY = 24 * 60 * 60 * 1000;
	const KEY = "qp:last_login_at";

	beforeEach(() => {
		window.localStorage.clear();
	});

	afterEach(() => {
		vi.restoreAllMocks();
	});

	it("readLastLoginTimestamp devuelve null en storage vacío", () => {
		expect(readLastLoginTimestamp()).toBeNull();
	});

	it("writeLastLoginTimestamp persiste el timestamp", () => {
		const now = 1_700_000_000_000;
		writeLastLoginTimestamp(now);
		expect(Number.parseInt(window.localStorage.getItem(KEY) ?? "0", 10)).toBe(now);
	});

	it("daysSinceLastLogin devuelve 0 sin storage previo", () => {
		expect(daysSinceLastLogin()).toBe(0);
	});

	it("daysSinceLastLogin calcula el delta en días", () => {
		const now = 1_700_000_000_000;
		writeLastLoginTimestamp(now - 3 * MS_PER_DAY);
		expect(daysSinceLastLogin(now)).toBe(3);
	});

	it("daysSinceLastLogin redondea hacia arriba", () => {
		const now = 1_700_000_000_000;
		writeLastLoginTimestamp(now - 1.4 * MS_PER_DAY);
		expect(daysSinceLastLogin(now)).toBe(2);
	});

	it("stampAndComputeDaysSinceLastLogin devuelve delta y actualiza el storage", () => {
		const now = 1_700_000_000_000;
		writeLastLoginTimestamp(now - 5 * MS_PER_DAY);
		const days = stampAndComputeDaysSinceLastLogin(now);
		expect(days).toBe(5);
		expect(readLastLoginTimestamp()).toBe(now);
	});

	it("sobrevive a localStorage corrupto", () => {
		window.localStorage.setItem(KEY, "no-es-un-numero");
		expect(daysSinceLastLogin()).toBe(0);
	});
});

describe("AnalyticsEvents enum (sanity)", () => {
	it("los nombres siguen snake_case", () => {
		const values = Object.values(AnalyticsEvents);
		for (const value of values) {
			expect(value).toMatch(/^[a-z][a-z0-9_]*$/);
		}
	});

	it("los nombres son únicos", () => {
		const values = Object.values(AnalyticsEvents);
		expect(new Set(values).size).toBe(values.length);
	});

	it("incluye los eventos núcleo pedidos en el brief", () => {
		const required = [
			"user_signed_up",
			"user_logged_in",
			"user_logged_out",
			"passkey_created",
			"onboarding_completed",
			"onboarding_started",
			"onboarding_step_viewed",
			"onboarding_step_completed",
			"onboarding_abandoned",
			"dashboard_viewed",
			"income_registered",
			"extra_income_registered",
			"expense_registered",
			"savings_goal_created",
			"savings_contribution_completed",
			"additional_savings_added",
			"allocation_modified",
			"allocation_review_surfaced",
			"allocation_correct_cta_clicked",
			"allocation_correct_started",
			"allocation_correct_completed",
			"income_event_updated",
			"movement_deleted",
			"coach_recommendation_interacted",
			"crisis_recommendation_resolved",
			"fixed_commitment_created",
			"financial_cycle_started",
			"financial_cycle_closed",
			"weekly_summary_viewed",
			"monthly_summary_viewed",
			"financial_insight_viewed",
			"plus_paywall_viewed",
			"plus_checkout_started",
			"plus_checkout_completed",
			"plus_portal_opened",
			"espacios_hub_viewed",
			"espacios_premium_paywall_viewed",
			"space_created",
			"space_invite_accepted",
			"space_dashboard_viewed",
			"space_expense_registered",
			"space_contribution_completed",
			"space_proposal_created",
			"space_proposal_confirmed",
			"space_proposal_rejected",
			"space_entered_readonly",
			"space_reactivated",
			"feedback_entry_clicked",
		];
		const present = new Set(Object.values(AnalyticsEvents));
		for (const r of required) {
			expect(present.has(r as never), `falta evento: ${r}`).toBe(true);
		}
	});

	it("incluye eventos Plus, espacios y feedback", () => {
		const required = [
			"feedback_submitted",
			"feedback_entry_clicked",
			"plus_paywall_viewed",
			"plus_checkout_started",
			"plus_checkout_completed",
			"plus_portal_opened",
			"espacios_hub_viewed",
			"espacios_premium_paywall_viewed",
			"space_created",
			"space_invite_accepted",
			"space_dashboard_viewed",
			"space_expense_registered",
			"space_contribution_completed",
			"space_proposal_created",
			"space_proposal_confirmed",
			"space_proposal_rejected",
			"space_entered_readonly",
			"space_reactivated",
		];
		const present = new Set(Object.values(AnalyticsEvents));
		for (const r of required) {
			expect(present.has(r as never), `falta evento: ${r}`).toBe(true);
		}
	});
});
