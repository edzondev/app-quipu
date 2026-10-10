import { cleanup, fireEvent, render } from "@testing-library/react-native";
import { useState } from "react";
import { ExpenseKeypad, KeypadAmount } from "@/shared/components/expenses/expense-keypad";

function Host() {
	const [cents, setCents] = useState(0);
	return (
		<>
			<KeypadAmount currencySymbol="S/" cents={cents} />
			<ExpenseKeypad amountCents={cents} onAmountChange={setCents} />
		</>
	);
}

describe("ExpenseKeypad", () => {
	afterEach(() => {
		cleanup();
	});

	it("no tiene coma: el monto entra en céntimos, con 0 y borrar en la última fila", async () => {
		const view = await render(<Host />);

		expect(view.queryByLabelText(",")).toBeNull();
		expect(view.queryByText(",")).toBeNull();
		expect(view.getByLabelText("0")).toBeTruthy();
		expect(view.getByLabelText("Borrar")).toBeTruthy();

		await fireEvent.press(view.getByText("4"));
		await fireEvent.press(view.getByText("2"));
		await fireEvent.press(view.getByLabelText("0"));
		await fireEvent.press(view.getByLabelText("0"));
		expect(view.getByLabelText("Monto").props.children).toBe("42.00");

		await fireEvent.press(view.getByLabelText("Borrar"));
		expect(view.getByLabelText("Monto").props.children).toBe("4.20");
	});
});
