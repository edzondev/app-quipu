import { cleanup, fireEvent, render } from "@testing-library/react-native";
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
			<IncomeSheetForm currencySymbol="S/" onSubmit={onSubmit} onCancel={jest.fn()} />,
		);

		expect(view.getByText(/Hoy/)).toBeTruthy();
		await fireEvent.press(view.getByText("1"));
		await fireEvent.press(view.getByText("0"));
		await fireEvent.press(view.getByText("0"));
		await fireEvent.press(view.getByText("Registrar ingreso"));

		expect(onSubmit).toHaveBeenCalledWith({
			amountCents: 100,
			occurredAt: limaStartOfDay(NOW),
		});
		expect(limaStartOfDay(NOW)).toBe(Date.parse("2026-10-09T05:00:00.000Z"));
	});
});
