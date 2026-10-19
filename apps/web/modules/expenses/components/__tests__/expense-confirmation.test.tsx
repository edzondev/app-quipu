import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { formatCents } from "@/shared/lib/money";
import { ExpenseConfirmation } from "../expense-confirmation";

afterEach(cleanup);

describe("ExpenseConfirmation", () => {
	it("no clampa un remaining negativo a cero", () => {
		const remainingAmount = -47_467;
		render(
			<ExpenseConfirmation
				amountCents={20_000}
				envelopeType="needs"
				remainingAmount={remainingAmount}
				currencyCode="PEN"
				startedAt={1_000}
				confirmedAt={1_400}
				onClose={() => {}}
			/>,
		);

		const signed = formatCents(remainingAmount, { currency: "PEN" });
		expect(screen.getByText((_, node) => node?.textContent === signed)).toBeTruthy();
		expect(
			screen.queryByText((_, node) => node?.textContent === formatCents(0, { currency: "PEN" })),
		).toBeNull();
	});
});
