import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { WizardStepIncome } from "../wizard-step-income";
import { WizardStepReserved } from "../wizard-step-reserved";
import { WizardStepSplit } from "../wizard-step-split";

afterEach(cleanup);

describe("WizardStepIncome", () => {
	it("edita el monto y avanza", () => {
		const onAmountChange = vi.fn();
		const onNext = vi.fn();
		const view = render(
			<WizardStepIncome
				amountText=""
				currencyCode="PEN"
				onAmountChange={onAmountChange}
				onNext={onNext}
			/>,
		);
		fireEvent.change(screen.getByLabelText(/ingresó|entró/i), {
			target: { value: "3800" },
		});
		expect(onAmountChange).toHaveBeenCalledWith("3800");
		view.rerender(
			<WizardStepIncome
				amountText="3800"
				currencyCode="PEN"
				onAmountChange={onAmountChange}
				onNext={onNext}
			/>,
		);
		fireEvent.click(screen.getByRole("button", { name: /continuar/i }));
		expect(onNext).toHaveBeenCalled();
	});

	it("bloquea continuar con monto inválido", () => {
		const onNext = vi.fn();
		render(
			<WizardStepIncome
				amountText=""
				currencyCode="PEN"
				onAmountChange={() => {}}
				onNext={onNext}
			/>,
		);
		fireEvent.click(screen.getByRole("button", { name: /continuar/i }));
		expect(onNext).not.toHaveBeenCalled();
	});
});

describe("WizardStepReserved", () => {
	const commitments = [{ id: "c1", name: "Cuota auto", amount: 250_000 }];

	it("muestra error cuando lo apartado supera el ingreso", () => {
		render(
			<WizardStepReserved
				incomeCents={380_000}
				spentCents={0}
				reservedText="4000"
				reservedMode="existing"
				commitmentId="c1"
				newCommitment={{
					name: "",
					amountCents: 0,
					dueDay: 0,
					envelope: "needs",
				}}
				commitments={commitments}
				currencyCode="PEN"
				onReservedChange={() => {}}
				onModeChange={() => {}}
				onCommitmentChange={() => {}}
				onNewCommitmentChange={() => {}}
				onBack={() => {}}
				onNext={() => {}}
			/>,
		);
		expect(screen.getByText(/no puede superar lo ingresado/i)).toBeTruthy();
	});

	it("deshabilita continuar sin compromiso en modo existing", () => {
		render(
			<WizardStepReserved
				incomeCents={380_000}
				spentCents={0}
				reservedText="2500"
				reservedMode="existing"
				commitmentId=""
				newCommitment={{
					name: "",
					amountCents: 0,
					dueDay: 0,
					envelope: "needs",
				}}
				commitments={commitments}
				currencyCode="PEN"
				onReservedChange={() => {}}
				onModeChange={() => {}}
				onCommitmentChange={() => {}}
				onNewCommitmentChange={() => {}}
				onBack={() => {}}
				onNext={() => {}}
			/>,
		);
		expect((screen.getByRole("button", { name: /continuar/i }) as HTMLButtonElement).disabled).toBe(
			true,
		);
	});

	it("deshabilita continuar sin monto en modo existing", () => {
		render(
			<WizardStepReserved
				incomeCents={380_000}
				spentCents={0}
				reservedText=""
				reservedMode="existing"
				commitmentId="c1"
				newCommitment={{
					name: "",
					amountCents: 0,
					dueDay: 0,
					envelope: "needs",
				}}
				commitments={commitments}
				currencyCode="PEN"
				onReservedChange={() => {}}
				onModeChange={() => {}}
				onCommitmentChange={() => {}}
				onNewCommitmentChange={() => {}}
				onBack={() => {}}
				onNext={() => {}}
			/>,
		);
		expect((screen.getByRole("button", { name: /continuar/i }) as HTMLButtonElement).disabled).toBe(
			true,
		);
	});

	it("en modo none oculta el monto y habilita continuar", () => {
		render(
			<WizardStepReserved
				incomeCents={380_000}
				spentCents={51_000}
				reservedText=""
				reservedMode="none"
				commitmentId=""
				newCommitment={{
					name: "",
					amountCents: 0,
					dueDay: 0,
					envelope: "needs",
				}}
				commitments={commitments}
				currencyCode="PEN"
				onReservedChange={() => {}}
				onModeChange={() => {}}
				onCommitmentChange={() => {}}
				onNewCommitmentChange={() => {}}
				onBack={() => {}}
				onNext={() => {}}
			/>,
		);
		expect(
			(screen.getByLabelText("No voy a apartar nada todavía") as HTMLInputElement).checked,
		).toBe(true);
		expect(screen.queryByLabelText("Monto apartado")).toBeNull();
		expect((screen.getByRole("button", { name: /continuar/i }) as HTMLButtonElement).disabled).toBe(
			false,
		);
	});

	it("muestra el disponible real cuando hay gasto previo", () => {
		render(
			<WizardStepReserved
				incomeCents={380_000}
				spentCents={51_000}
				reservedText="2500"
				reservedMode="existing"
				commitmentId="c1"
				newCommitment={{
					name: "",
					amountCents: 0,
					dueDay: 0,
					envelope: "needs",
				}}
				commitments={commitments}
				currencyCode="PEN"
				onReservedChange={() => {}}
				onModeChange={() => {}}
				onCommitmentChange={() => {}}
				onNewCommitmentChange={() => {}}
				onBack={() => {}}
				onNext={() => {}}
			/>,
		);
		expect(screen.getByText(/disponible real/i)).toBeTruthy();
	});
});

describe("WizardStepSplit", () => {
	const targets = { needs: 65_000, wants: 39_000, savings: 26_000 };

	it("stepper suma y muestra el total asignado y el gasto del ciclo", () => {
		const onTargetChange = vi.fn();
		render(
			<WizardStepSplit
				freeCents={130_000}
				targets={targets}
				currencyCode="PEN"
				spentCents={51_000}
				onTargetChange={onTargetChange}
				onResetProposal={() => {}}
				onBack={() => {}}
				onSubmit={() => {}}
			/>,
		);
		fireEvent.click(screen.getAllByRole("button", { name: "+" })[0]!);
		expect(onTargetChange).toHaveBeenCalledWith("needs", 65_000 + 10_000);
		expect(screen.getByText(/sobres quedarán/i)).toBeTruthy();
		expect(screen.getByText(/ya gastaste/i)).toBeTruthy();
	});

	it("deshabilita aplicar cuando recibe disabled", () => {
		render(
			<WizardStepSplit
				freeCents={130_000}
				targets={targets}
				currencyCode="PEN"
				spentCents={0}
				onTargetChange={() => {}}
				onResetProposal={() => {}}
				onBack={() => {}}
				onSubmit={() => {}}
				disabled={true}
			/>,
		);
		expect(
			(
				screen.getByRole("button", {
					name: /aplicar corrección/i,
				}) as HTMLButtonElement
			).disabled,
		).toBe(true);
	});
});
