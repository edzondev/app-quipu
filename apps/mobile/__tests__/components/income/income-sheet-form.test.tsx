import { cleanup, fireEvent, render } from "@testing-library/react-native";
import { useState } from "react";
import { Pressable } from "react-native";
import { extraKind, sueldoKind } from "@/__fixtures__/income-kind";
import { IncomeSheetForm } from "@/shared/components/income/income-sheet-form";
import type { IncomeDraft } from "@/shared/lib/income/draft";
import { toCreateIncomeEventArgs } from "@/shared/lib/income/draft";
import { limaStartOfDay } from "@/shared/lib/lima-date";
import { assertCreateIncomeEventArgs } from "@/test-support/assert-create-income-event-args";

jest.mock("@/shared/components/ui/reicon", () => ({
	ChevronRight: () => null,
}));

const NOW = Date.parse("2026-10-10T02:30:00.000Z");
const NEW_CYCLE = "income-mode-new-cycle";
const ADD_TO_CYCLE = "income-mode-add";

type Rendered = Awaited<ReturnType<typeof render>>;

function selected(view: Rendered, testID: string) {
	return view.getByTestId(testID).props.accessibilityState.selected === true;
}

function isIncomeDraft(value: unknown): value is IncomeDraft {
	if (typeof value !== "object" || value === null) return false;
	return "amountCents" in value && "occurredAt" in value && "incomeKind" in value;
}

function submittedArgs(onSubmit: jest.Mock) {
	const draft = onSubmit.mock.calls[0]?.[0];
	if (!isIncomeDraft(draft)) throw new Error("createIncomeEvent: no hubo submit");
	const args = toCreateIncomeEventArgs(draft);
	assertCreateIncomeEventArgs(args);
	return args;
}

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
		await fireEvent.press(view.getByText("1"));
		await fireEvent.press(view.getByText("0"));
		await fireEvent.press(view.getByText("0"));
		await fireEvent.press(view.getByText("Registrar ingreso"));

		expect(onSubmit).toHaveBeenCalledWith(
			expect.objectContaining({
				amountCents: 100,
				occurredAt: limaStartOfDay(NOW),
			}),
		);
		expect(limaStartOfDay(NOW)).toBe(Date.parse("2026-10-09T05:00:00.000Z"));
	});

	it("con el ciclo corriendo ofrece las dos opciones y deja sumar al actual", async () => {
		const onSubmit = jest.fn();
		const view = await render(
			<IncomeSheetForm currencySymbol="S/" cycle="open" onSubmit={onSubmit} onCancel={jest.fn()} />,
		);

		expect(view.getByTestId(NEW_CYCLE)).toBeTruthy();
		expect(view.getByTestId(ADD_TO_CYCLE)).toBeTruthy();
		expect(view.getByTestId(NEW_CYCLE).props.accessibilityHint).toBe("Abre un período nuevo");
		expect(view.getByTestId(ADD_TO_CYCLE).props.accessibilityHint).toBe("Sin cerrar este período");
		expect(selected(view, ADD_TO_CYCLE)).toBe(true);
		expect(selected(view, NEW_CYCLE)).toBe(false);
		expect(view.queryByText("Tu sueldo empieza un ciclo nuevo")).toBeNull();
		expect(view.queryByText("Cierra este ciclo y empieza uno nuevo")).toBeNull();

		await fireEvent.press(view.getByText("5"));
		await fireEvent.press(view.getByText("Registrar ingreso"));

		expect(submittedArgs(onSubmit)).toEqual({
			amount: 5,
			source: "payroll",
			description: "Sueldo",
			occurredAt: limaStartOfDay(Date.now()),
			incomeKind: extraKind,
			extraordinaryType: "custom",
			extraordinaryLabel: "Extra",
			distributionPolicy: "profile_default",
		});
	});

	it("en un ciclo corriendo se puede elegir empezar uno nuevo", async () => {
		const onSubmit = jest.fn();
		const view = await render(
			<IncomeSheetForm currencySymbol="S/" cycle="open" onSubmit={onSubmit} onCancel={jest.fn()} />,
		);

		await fireEvent.press(view.getByTestId(NEW_CYCLE));
		expect(selected(view, NEW_CYCLE)).toBe(true);
		await fireEvent.press(view.getByText("8"));
		await fireEvent.press(view.getByText("Registrar ingreso"));

		expect(submittedArgs(onSubmit)).toEqual({
			amount: 8,
			source: "payroll",
			description: "Sueldo",
			occurredAt: limaStartOfDay(Date.now()),
			incomeKind: sueldoKind,
		});
	});

	it("con el ciclo vencido ofrece las dos opciones y deja empezar uno nuevo", async () => {
		const onSubmit = jest.fn();
		const view = await render(
			<IncomeSheetForm
				currencySymbol="S/"
				cycle="pastEnd"
				onSubmit={onSubmit}
				onCancel={jest.fn()}
			/>,
		);

		expect(view.getByTestId(NEW_CYCLE)).toBeTruthy();
		expect(view.getByTestId(ADD_TO_CYCLE)).toBeTruthy();
		expect(selected(view, NEW_CYCLE)).toBe(true);
		expect(selected(view, ADD_TO_CYCLE)).toBe(false);
		expect(view.queryByText("Tu sueldo empieza un ciclo nuevo")).toBeNull();
		expect(view.queryByText("Cierra este ciclo y empieza uno nuevo")).toBeNull();

		await fireEvent.press(view.getByText("4"));
		await fireEvent.press(view.getByText("Registrar ingreso"));

		expect(submittedArgs(onSubmit)).toEqual({
			amount: 4,
			source: "payroll",
			description: "Sueldo",
			occurredAt: limaStartOfDay(Date.now()),
			incomeKind: sueldoKind,
		});
	});

	it("con el ciclo vencido se puede sumar al actual", async () => {
		const onSubmit = jest.fn();
		const view = await render(
			<IncomeSheetForm
				currencySymbol="S/"
				cycle="pastEnd"
				onSubmit={onSubmit}
				onCancel={jest.fn()}
			/>,
		);

		await fireEvent.press(view.getByTestId(ADD_TO_CYCLE));
		expect(selected(view, ADD_TO_CYCLE)).toBe(true);
		await fireEvent.press(view.getByText("6"));
		await fireEvent.press(view.getByText("Registrar ingreso"));

		expect(submittedArgs(onSubmit)).toMatchObject({
			amount: 6,
			incomeKind: extraKind,
			extraordinaryType: "custom",
			extraordinaryLabel: "Extra",
			distributionPolicy: "profile_default",
		});
	});

	it("sin ciclo solo ofrece empezar uno nuevo", async () => {
		const onSubmit = jest.fn();
		const view = await render(
			<IncomeSheetForm currencySymbol="S/" cycle="none" onSubmit={onSubmit} onCancel={jest.fn()} />,
		);

		expect(view.getByTestId(NEW_CYCLE)).toBeTruthy();
		expect(selected(view, NEW_CYCLE)).toBe(true);
		expect(view.queryByTestId(ADD_TO_CYCLE)).toBeNull();
		expect(view.queryByText("Tu sueldo empieza un ciclo nuevo")).toBeNull();
		expect(view.queryByText("Cierra este ciclo y empieza uno nuevo")).toBeNull();

		await fireEvent.press(view.getByText("5"));
		await fireEvent.press(view.getByText("Registrar ingreso"));

		expect(submittedArgs(onSubmit)).toEqual({
			amount: 5,
			source: "payroll",
			description: "Sueldo",
			occurredAt: limaStartOfDay(Date.now()),
			incomeKind: sueldoKind,
		});
	});

	it("si estaba sumando y el ciclo desaparece, el valor queda en el ciclo nuevo", async () => {
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
		await fireEvent.press(view.getByTestId(ADD_TO_CYCLE));
		expect(selected(view, ADD_TO_CYCLE)).toBe(true);
		await fireEvent.press(view.getByTestId("drop-cycle"));
		expect(view.queryByTestId(ADD_TO_CYCLE)).toBeNull();
		expect(selected(view, NEW_CYCLE)).toBe(true);
		await fireEvent.press(view.getByText("5"));
		await fireEvent.press(view.getByText("Registrar ingreso"));
		expect(onSubmit).toHaveBeenCalledWith(expect.objectContaining({ incomeKind: sueldoKind }));
	});
});
