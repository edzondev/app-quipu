import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("@/core/analytics", () => ({
	AnalyticsEvents: { ENVELOPE_OPENED: "envelope_opened" },
	track: vi.fn(),
}));

import { ExpenseRegisterContextProvider } from "@/modules/expenses/hooks/use-expense-register-context";
import { formatCents } from "@/shared/lib/money";
import type { DashboardEnvelope } from "../../types";
import { EnvelopeCards } from "../envelope-cards";

afterEach(cleanup);

const CURRENCY = "PEN";
const EDZON_NEEDS_REMAINING_CENTS = -47_467;

function envelope(
	partial: Partial<DashboardEnvelope> & Pick<DashboardEnvelope, "type">,
): DashboardEnvelope {
	return {
		remainingAmount: 80_000,
		allocatedAmount: 100_000,
		percentRemaining: 80,
		carriedOverCents: 0,
		incomeCents: 100_000,
		totalCents: 100_000,
		...partial,
	};
}

function renderCards(envelopes: DashboardEnvelope[], savedCents?: number) {
	return render(
		<ExpenseRegisterContextProvider>
			<EnvelopeCards envelopes={envelopes} currencyCode={CURRENCY} savedCents={savedCents} />
		</ExpenseRegisterContextProvider>,
	);
}

function money(cents: number): string {
	return formatCents(cents, { currency: CURRENCY });
}

function getByExactText(label: string) {
	return screen.getByText((_, node) => node?.textContent === label);
}

function queryByExactText(label: string) {
	return screen.queryByText((_, node) => node?.textContent === label);
}

describe("EnvelopeCards", () => {
	it("muestra Necesidades en negativo firmado con Te pasaste (ejemplo Edzon)", () => {
		const signed = money(EDZON_NEEDS_REMAINING_CENTS);
		renderCards([
			envelope({
				type: "needs",
				remainingAmount: EDZON_NEEDS_REMAINING_CENTS,
				allocatedAmount: 200_000,
				percentRemaining: -24,
			}),
			envelope({ type: "wants" }),
			envelope({ type: "savings" }),
		]);

		expect(getByExactText(`${signed} · Te pasaste`)).toBeTruthy();
		expect(signed).toMatch(/[−-].*474\.67/);
	});

	it("pinta solo la palabra Te pasaste con color de alerta, sin fondo", () => {
		renderCards([
			envelope({
				type: "needs",
				remainingAmount: EDZON_NEEDS_REMAINING_CENTS,
				allocatedAmount: 200_000,
			}),
			envelope({ type: "wants" }),
			envelope({ type: "savings" }),
		]);

		const word = screen.getByText("Te pasaste");
		expect(word.className).toMatch(/text-warning-text/);
		expect(word.className).not.toMatch(/\bbg-/);
		const card = word.closest("article");
		expect(card?.className).toMatch(/bg-card/);
		expect(card?.className).not.toMatch(/bg-danger|bg-warning|bg-clay-soft/);
	});

	it("un sobre en positivo no muestra Te pasaste ni cambia de look", () => {
		renderCards([
			envelope({ type: "needs", remainingAmount: 80_000, allocatedAmount: 100_000 }),
			envelope({ type: "wants", remainingAmount: 45_000, allocatedAmount: 60_000 }),
			envelope({ type: "savings", remainingAmount: 10_000, allocatedAmount: 30_000 }),
		]);

		expect(screen.queryByText("Te pasaste")).toBeNull();
		expect(getByExactText(money(80_000))).toBeTruthy();
	});

	it("separa Ahorro planeado y Ahorro ya guardado con valores distintos", () => {
		const plannedCents = 40_000;
		const savedCents = 125_000;
		renderCards(
			[
				envelope({ type: "needs" }),
				envelope({ type: "wants" }),
				envelope({
					type: "savings",
					allocatedAmount: plannedCents,
					remainingAmount: 12_000,
				}),
			],
			savedCents,
		);

		expect(screen.getByText("Ahorro planeado")).toBeTruthy();
		expect(screen.getByText("Ahorro ya guardado")).toBeTruthy();
		expect(getByExactText(money(plannedCents))).toBeTruthy();
		expect(getByExactText(money(savedCents))).toBeTruthy();
		expect(queryByExactText(money(12_000))).toBeNull();
	});
});
