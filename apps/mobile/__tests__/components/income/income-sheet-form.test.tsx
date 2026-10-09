import { cleanup, fireEvent, render } from "@testing-library/react-native";
import { useState } from "react";
import { Pressable } from "react-native";
import { extraKind, sueldoKind } from "@/__fixtures__/income-kind";
import { IncomeSheetForm } from "@/shared/components/income/income-sheet-form";
import { limaStartOfDay } from "@/shared/lib/lima-date";

jest.mock("@/shared/components/ui/reicon", () => ({
	ChevronRight: () => null,
}));

const NOW = Date.parse("2026-10-10T02:30:00.000Z");

describe("IncomeSheetForm", () => {
	afterEach(() => {
		cleanup();
		jest.restoreAllMocks();
	});

	it("guarda el monto con la fecha de hoy en Lima", async () => {
		jest.spyOn(Date, "now").mockReturnValue(NOW);
		const onSubmit = jest.fn();
		const view = await render(
			<IncomeSheetForm currencySymbol="S/" cycle="open" onSubmit={onSubmit} onCancel={jest.fn()} />,
		);

		expect(view.getByText(/Hoy/)).toBeTruthy();
		expect(view.queryByText("Tu sueldo empieza un ciclo nuevo")).toBeNull();
		expect(view.queryByText("Cierra este ciclo y empieza uno nuevo")).toBeNull();
		expect(view.getByRole("button", { name: "Sueldo" })).toBeTruthy();
		expect(view.getByRole("button", { name: "Extra" })).toBeTruthy();
		await fireEvent.press(view.getByText("1"));
		await fireEvent.press(view.getByText("0"));
		await fireEvent.press(view.getByText("0"));
		await fireEvent.press(view.getByText("Registrar ingreso"));

		expect(onSubmit).toHaveBeenCalledWith({
			amountCents: 100,
			occurredAt: limaStartOfDay(NOW),
			incomeKind: sueldoKind,
		});
		expect(limaStartOfDay(NOW)).toBe(Date.parse("2026-10-09T05:00:00.000Z"));
	});

	it("con ciclo activo manda Extra como extraordinary", async () => {
		const onSubmit = jest.fn();
		const view = await render(
			<IncomeSheetForm currencySymbol="S/" cycle="open" onSubmit={onSubmit} onCancel={jest.fn()} />,
		);
		await fireEvent.press(view.getByRole("button", { name: "Extra" }));
		expect(view.getByRole("button", { name: "Extra" }).props.accessibilityState.selected).toBe(
			true,
		);
		await fireEvent.press(view.getByText("5"));
		await fireEvent.press(view.getByText("Registrar ingreso"));
		expect(onSubmit).toHaveBeenCalledWith(
			expect.objectContaining({ amountCents: 5, incomeKind: extraKind }),
		);
	});

	it("sin ciclo solo ofrece Sueldo y explica el ciclo nuevo", async () => {
		const onSubmit = jest.fn();
		const view = await render(
			<IncomeSheetForm currencySymbol="S/" cycle="none" onSubmit={onSubmit} onCancel={jest.fn()} />,
		);
		expect(view.getByRole("button", { name: "Sueldo" })).toBeTruthy();
		expect(view.queryByRole("button", { name: "Extra" })).toBeNull();
		expect(view.getByText("Tu sueldo empieza un ciclo nuevo")).toBeTruthy();
		expect(view.queryByText("Cierra este ciclo y empieza uno nuevo")).toBeNull();
		await fireEvent.press(view.getByText("5"));
		await fireEvent.press(view.getByText("Registrar ingreso"));
		expect(onSubmit).toHaveBeenCalledWith(expect.objectContaining({ incomeKind: sueldoKind }));
	});

	it("si estaba Extra y el ciclo desaparece, queda Sueldo seleccionado", async () => {
		const onSubmit = jest.fn();
		function Host() {
			const [cycle, setCycle] = useState<"pastEnd" | "none">("pastEnd");
			return (
				<>
					<Pressable testID="drop-cycle" onPress={() => setCycle("none")} />
					<IncomeSheetForm
						currencySymbol="S/"
						cycle={cycle}
						onSubmit={onSubmit}
						onCancel={jest.fn()}
					/>
				</>
			);
		}
		const view = await render(<Host />);
		await fireEvent.press(view.getByRole("button", { name: "Extra" }));
		expect(view.getByRole("button", { name: "Extra" }).props.accessibilityState.selected).toBe(
			true,
		);
		await fireEvent.press(view.getByTestId("drop-cycle"));
		expect(view.queryByRole("button", { name: "Extra" })).toBeNull();
		expect(view.getByRole("button", { name: "Sueldo" }).props.accessibilityState.selected).toBe(
			true,
		);
		await fireEvent.press(view.getByText("5"));
		await fireEvent.press(view.getByText("Registrar ingreso"));
		expect(onSubmit).toHaveBeenCalledWith(expect.objectContaining({ incomeKind: sueldoKind }));
	});

	it("con ciclo vencido ofrece Extra y el sueldo dice que cierra el ciclo", async () => {
		const view = await render(
			<IncomeSheetForm
				currencySymbol="S/"
				cycle="pastEnd"
				onSubmit={jest.fn()}
				onCancel={jest.fn()}
			/>,
		);
		expect(view.getByRole("button", { name: "Sueldo" })).toBeTruthy();
		expect(view.getByRole("button", { name: "Extra" })).toBeTruthy();
		expect(view.getByText("Cierra este ciclo y empieza uno nuevo")).toBeTruthy();
		expect(view.queryByText("Tu sueldo empieza un ciclo nuevo")).toBeNull();
	});
});
