import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { OnboardingProvider, useOnboarding } from "../onboarding-provider";
import { Step1IncomeProfile } from "../step-1-income-profile";

afterEach(() => {
	cleanup();
	sessionStorage.clear();
});

function StateProbe() {
	const { state } = useOnboarding();
	return (
		<div>
			<span data-testid="country">{state.country}</span>
			<span data-testid="currencyCode">{state.currencyCode}</span>
			<span data-testid="currencySymbol">{state.currencySymbol}</span>
			<span data-testid="marketId">{state.marketId}</span>
		</div>
	);
}

function renderStep() {
	return render(
		<OnboardingProvider>
			<Step1IncomeProfile onNext={() => {}} onStepCompleted={() => {}} />
			<StateProbe />
		</OnboardingProvider>,
	);
}

function text(testId: string): string {
	const value = screen.getByTestId(testId).textContent;
	if (value == null || value.length === 0) {
		throw new Error(`empty ${testId}`);
	}
	return value;
}

const CURRENCY_NAMES = ["Sol", "Euro", "Dólar"];

function currencyButton(name: string): HTMLElement {
	const label = screen.getByText(name);
	const button = label.closest("button");
	if (button == null) {
		throw new Error(`no button for ${name}`);
	}
	return button;
}

describe("Step1IncomeProfile", () => {
	it("ofrece Sol, Euro y Dólar bajo Moneda", () => {
		renderStep();

		expect(screen.getByText("Moneda")).toBeTruthy();
		expect(screen.queryByText("País y moneda")).toBeNull();
		expect(screen.queryByRole("button", { name: /Perú|España|Estados Unidos/ })).toBeNull();
		expect(screen.queryByRole("button", { name: /Sol peruano|Dólar estadounidense/ })).toBeNull();

		for (const name of CURRENCY_NAMES) {
			expect(currencyButton(name)).toBeTruthy();
		}
	});

	it("deriva el país desde la moneda elegida", () => {
		renderStep();

		fireEvent.click(currencyButton("Euro"));
		expect(text("country")).toBe("España");
		expect(text("currencyCode")).toBe("EUR");
		expect(text("currencySymbol")).toBe("€");
		expect(text("marketId")).toBe("es");

		fireEvent.click(currencyButton("Dólar"));
		expect(text("country")).toBe("Estados Unidos");
		expect(text("currencyCode")).toBe("USD");
		expect(text("currencySymbol")).toBe("$");
		expect(text("marketId")).toBe("us");

		fireEvent.click(currencyButton("Sol"));
		expect(text("country")).toBe("Perú");
		expect(text("currencyCode")).toBe("PEN");
		expect(text("currencySymbol")).toBe("S/");
		expect(text("marketId")).toBe("pe");
	});
});
