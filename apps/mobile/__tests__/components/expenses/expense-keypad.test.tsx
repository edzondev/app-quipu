import { cleanup, fireEvent, render, within } from "@testing-library/react-native";
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
		expect(view.getByTestId("keypad-0")).toBeTruthy();
		expect(view.getByTestId("keypad-backspace")).toBeTruthy();

		const zero = view.getByTestId("keypad-0");
		let grid = zero.parent;
		while (grid && !String(grid.props.className ?? "").includes("flex-wrap")) {
			grid = grid.parent;
		}
		if (!grid) {
			throw new Error("keypad grid not found");
		}
		const slots = grid.children.filter(
			(node): node is Exclude<typeof node, string> => typeof node !== "string",
		);
		expect(slots).toHaveLength(12);
		const blank = slots[9];
		const zeroSlot = slots[10];
		const backspaceSlot = slots[11];
		if (!blank || !zeroSlot || !backspaceSlot) {
			throw new Error("last keypad row is missing a slot");
		}
		expect(blank.props.collapsable).toBe(false);
		expect(String(blank.props.className ?? "")).toContain("w-1/3");
		expect(String(zeroSlot.props.className ?? "")).toContain("w-1/3");
		expect(String(backspaceSlot.props.className ?? "")).toContain("w-1/3");
		expect(blank.props.accessibilityRole).toBeUndefined();
		expect(blank.props.onPress).toBeUndefined();
		expect(within(blank).queryByRole("button")).toBeNull();
		expect(within(zeroSlot).getByTestId("keypad-0")).toBe(zero);
		expect(within(backspaceSlot).getByTestId("keypad-backspace").props.accessibilityLabel).toBe(
			"Borrar",
		);

		await fireEvent.press(view.getByText("4"));
		await fireEvent.press(view.getByText("2"));
		await fireEvent.press(view.getByLabelText("0"));
		await fireEvent.press(view.getByLabelText("0"));
		expect(view.getByLabelText("Monto").props.children).toBe("42.00");

		await fireEvent.press(view.getByLabelText("Borrar"));
		expect(view.getByLabelText("Monto").props.children).toBe("4.20");
	});
});
