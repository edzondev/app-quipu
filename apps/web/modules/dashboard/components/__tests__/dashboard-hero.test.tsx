import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("@/core/analytics", () => ({
	AnalyticsEvents: { ALLOCATION_CORRECT_CTA_CLICKED: "allocation_correct_cta_clicked" },
	track: vi.fn(),
}));

import { formatCents } from "@/shared/lib/money";
import type { DashboardCycle, DashboardHero as DashboardHeroData } from "../../types";
import { DashboardHero } from "../dashboard-hero";

afterEach(cleanup);

const SNAPSHOT_DAILY_CENTS = 32_100;
const DISPLAY_CLAMPED_CENTS = 99_999;

function hero(partial: Partial<DashboardHeroData> = {}): DashboardHeroData {
	return {
		dailyAvailableCents: SNAPSHOT_DAILY_CENTS,
		displayDailyCents: DISPLAY_CLAMPED_CENTS,
		bodyCopy: undefined,
		validationCopy: undefined,
		statusBadge: "stable",
		spendableCents: 80_000,
		reservedCents: 0,
		unallocatedCents: 0,
		needsOverspentCents: 0,
		wantsOverspentCents: 0,
		...partial,
	};
}

function cycle(): DashboardCycle {
	return {
		id: "cycle-1" as DashboardCycle["id"],
		startDate: 1,
		endDate: 2,
		needsReview: false,
		unallocatedCents: 0,
		carriedOverFromCycleId: null,
		carriedOverExtraordinaryCents: 0,
		isOpeningCycle: false,
		daysTotal: 30,
		daysRemaining: 12,
		daysElapsed: 18,
		progressPercent: 60,
		pastEnd: false,
		startedToday: false,
	};
}

describe("DashboardHero Puedes gastar hoy", () => {
	it("consume dailyAvailableCents del snapshot, no displayDailyCents", () => {
		render(<DashboardHero hero={hero()} cycle={cycle()} currencyCode="PEN" />);

		expect(screen.getByText("Puedes gastar hoy")).toBeTruthy();
		expect(
			screen.getByText(
				(_, node) => node?.textContent === formatCents(SNAPSHOT_DAILY_CENTS, { currency: "PEN" }),
			),
		).toBeTruthy();
		expect(
			screen.queryByText(
				(_, node) => node?.textContent === formatCents(DISPLAY_CLAMPED_CENTS, { currency: "PEN" }),
			),
		).toBeNull();
	});
});
