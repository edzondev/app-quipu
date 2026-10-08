import { cleanup, fireEvent, render } from "@testing-library/react-native";
import { closeReport, progressOverview, progressRewards } from "@/__fixtures__/progress";
import { savingsOverview } from "@/__fixtures__/savings-overview";
import { CloseScreen } from "@/shared/components/progress/close-screen";
import { ProgressScreen } from "@/shared/components/progress/progress-screen";
import {
	type ProgressOverview,
	type ProgressRewards,
	presentClose,
	presentProgress,
} from "@/shared/lib/progress/model";

type Overview = NonNullable<ProgressOverview>;
type Rewards = NonNullable<ProgressRewards>;

const MAY = Date.parse("2026-05-15T17:00:00.000Z");
const SEP = Date.parse("2026-09-15T17:00:00.000Z");

const screenProps = {
	status: "ready" as const,
	onOpenClose: jest.fn(),
	onOpenPlan: jest.fn(),
};

describe("ProgressScreen", () => {
	afterEach(() => {
		cleanup();
	});

	it("muestra la racha, DESDE, los meses y los contadores", async () => {
		const view = await render(
			<ProgressScreen
				{...screenProps}
				model={presentProgress(progressOverview, progressRewards, savingsOverview, null)}
			/>,
		);

		expect(view.getByText("Progreso")).toBeTruthy();
		expect(view.getByText("3")).toBeTruthy();
		expect(view.getByText("seguidos")).toBeTruthy();
		expect(view.getByText("DESDE MAYO")).toBeTruthy();
		expect(view.getByText("MAY")).toBeTruthy();
		expect(view.getByText("SEP")).toBeTruthy();
		expect(view.getByText("MAYO")).toBeTruthy();
		expect(view.getByText("AHORRADO TOTAL")).toBeTruthy();
		expect(view.getByText("S/ 4,320")).toBeTruthy();
		expect(view.getByText("GASTOS REGISTRADOS").parent?.props.className ?? "").not.toContain(
			"flex-1",
		);
		expect(view.getByText("GASTOS REGISTRADOS")).toBeTruthy();
		expect(view.getByText("312")).toBeTruthy();
		expect(view.getByText("DÍAS SIN SALTAR")).toBeTruthy();
		expect(view.getByText("46")).toBeTruthy();
		expect(view.getByText("Primer ciclo cerrado")).toBeTruthy();
		expect(view.getByText("RECOMPENSA")).toBeTruthy();
		expect(view.queryByText("Ver ahorro y metas")).toBeNull();
		expect(view.queryByText("first_cycle_closed")).toBeNull();
	});

	it("etiqueta desde cycleStart y marca la barra en curso", async () => {
		const view = await render(
			<ProgressScreen
				{...screenProps}
				model={presentProgress(
					{
						...progressOverview,
						chartBars: [
							{
								id: MAY,
								status: "compliant",
								heightPx: 26,
								cycleStart: MAY,
								monthLabel: null,
							},
							{
								id: SEP,
								status: "current",
								heightPx: 26,
								cycleStart: SEP,
								monthLabel: "Setiembre",
							},
						],
					} satisfies Overview,
					progressRewards,
					savingsOverview,
					null,
				)}
			/>,
		);

		expect(view.getByText("MAY")).toBeTruthy();
		expect(view.getByText("SEP")).toBeTruthy();
		expect(view.getByLabelText("Ciclo en curso")).toBeTruthy();
		expect(view.getByText("DESDE MAYO")).toBeTruthy();
	});

	it("centra el vacío y abre Plan", async () => {
		const onOpenPlan = jest.fn();
		const view = await render(
			<ProgressScreen
				{...screenProps}
				onOpenPlan={onOpenPlan}
				model={presentProgress(
					{
						...progressOverview,
						currentStreak: 0,
						chartBars: [
							{
								id: SEP,
								status: "current",
								heightPx: 26,
								cycleStart: SEP,
								monthLabel: "Setiembre",
							},
						],
						achievements: [],
					} satisfies Overview,
					{ ...progressRewards, rewards: [] } satisfies Rewards,
					null,
					null,
				)}
			/>,
		);

		expect(view.getByText("Aún no cierras un ciclo.")).toBeTruthy();
		expect(view.queryByLabelText("Ciclo en curso")).toBeNull();
		expect(view.queryByText("CICLOS CERRADOS EN VERDE")).toBeNull();
		expect(view.queryByText(/DESDE/)).toBeNull();
		expect(view.queryByText("GASTOS REGISTRADOS")).toBeNull();
		await fireEvent.press(view.getByLabelText("Ir a Plan"));
		expect(onOpenPlan).toHaveBeenCalledTimes(1);
	});

	it("abre el cierre destacado con borde savings y lo oculta cuando no hay reporte", async () => {
		const onOpenClose = jest.fn();
		const present = await render(
			<ProgressScreen
				{...screenProps}
				onOpenClose={onOpenClose}
				model={presentProgress(progressOverview, progressRewards, savingsOverview, closeReport)}
			/>,
		);
		const card = present.getByLabelText("CICLO CERRADO · JULIO");
		expect(card.props.className).toContain("border-savings");
		expect(card.props.className).not.toContain("#5E8C79");
		await fireEvent.press(card);
		expect(onOpenClose).toHaveBeenCalledTimes(1);

		const absent = await render(
			<ProgressScreen
				{...screenProps}
				model={presentProgress(progressOverview, progressRewards, savingsOverview, null)}
			/>,
		);
		expect(absent.queryByText("CICLO CERRADO · JULIO")).toBeNull();
	});
});

describe("CloseScreen", () => {
	afterEach(() => {
		cleanup();
	});

	it("oculta mover y los porcentajes, y nombra los sobres en español", async () => {
		const view = await render(
			<CloseScreen
				status="ready"
				model={presentClose(closeReport, savingsOverview)}
				onBack={jest.fn()}
			/>,
		);

		expect(view.getByText("Cerraste julio con S/ 210 de sobra.")).toBeTruthy();
		expect(view.getByText("GASTADO S/ 3,290")).toBeTruthy();
		expect(view.getByText("SOBRÓ S/ 210")).toBeTruthy();
		expect(view.getByText("Necesidades")).toBeTruthy();
		expect(view.queryByText("Mover S/ 210 al Fondo")).toBeNull();
		expect(view.queryByText("Dejarlos en Gustos")).toBeNull();
		expect(view.queryByText(/%/)).toBeNull();
		expect(view.queryByText("cycle-1")).toBeNull();
		expect(view.queryByLabelText(/Tramo/)).toBeNull();
		expect(view.getByLabelText("Sobró").props.accessibilityLabel).toBe("Sobró");
		for (const label of ["Necesidades", "Gustos", "Ahorro"]) {
			const named = view.getAllByLabelText(label);
			expect(named.some((node) => node.props.accessibilityLabel === label)).toBe(true);
		}
	});

	it("muestra carga mientras el reporte no llega", async () => {
		const view = await render(<CloseScreen status="loading" model={null} onBack={jest.fn()} />);
		expect(view.getByText("Cargando…")).toBeTruthy();
		expect(view.queryByText("Aún no hay un cierre.")).toBeNull();
	});

	it("centra el vacío y vuelve a Progreso cuando el query es null", async () => {
		const onBack = jest.fn();
		const view = await render(<CloseScreen status="ready" model={null} onBack={onBack} />);
		expect(view.getByText("Aún no hay un cierre.")).toBeTruthy();
		expect(view.getByText("El resumen aparece al cerrar un ciclo.")).toBeTruthy();
		expect(view.queryByText("Cargando…")).toBeNull();
		await fireEvent.press(view.getByLabelText("Volver a Progreso"));
		expect(onBack).toHaveBeenCalledTimes(1);
	});
});
