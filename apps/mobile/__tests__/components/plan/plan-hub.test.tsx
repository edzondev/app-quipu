import { act, fireEvent, render } from "@testing-library/react-native";
import { PlanHub } from "@/shared/components/plan/plan-hub";
import type { PlanHubModel } from "@/shared/lib/plan/model";

jest.mock("@/shared/components/ui/reicon", () => ({
	ChevronRight: () => null,
}));

const model: PlanHubModel = {
	cycleLabel: "CICLO AGOSTO",
	totalLabel: "S/ 2,069",
	segments: [
		{ tone: "needs", percent: 55 },
		{ tone: "wants", percent: 11 },
		{ tone: "savings", percent: 34 },
	],
	envelopeCount: "3",
	commitmentsSubtitle: "Alquiler vence mañana",
	commitmentsTone: "warning",
	commitmentsTotal: "S/ 1,265",
	repartoSubtitle: "50 / 30 / 20 · Mensual · día 1",
};

const ahorro = { subtitle: "Fondo + 2 metas activas", totalLabel: "S/ 4,320" };

async function renderHub(overrides: Partial<Parameters<typeof PlanHub>[0]> = {}) {
	const onOpenSobres = jest.fn();
	const onOpenCommitments = jest.fn();
	const onOpenAhorro = jest.fn();
	const view = await render(
		<PlanHub
			status="ready"
			model={model}
			ahorro={ahorro}
			onOpenSobres={onOpenSobres}
			onOpenCommitments={onOpenCommitments}
			onOpenAhorro={onOpenAhorro}
			{...overrides}
		/>,
	);
	return { view, onOpenSobres, onOpenCommitments, onOpenAhorro };
}

describe("PlanHub", () => {
	it("muestra el copy de 3i, el total, la barra y navega cada fila", async () => {
		const { view, onOpenSobres, onOpenCommitments, onOpenAhorro } = await renderHub();
		expect(view.getByText("Plan")).toBeTruthy();
		expect(view.getByText("Dónde está tu dinero antes de que lo gastes.")).toBeTruthy();
		expect(view.getByText("CICLO AGOSTO")).toBeTruthy();
		expect(view.getByText("TOTAL REPARTIDO")).toBeTruthy();
		expect(view.getByText("S/ 2,069")).toBeTruthy();
		expect(view.getByLabelText("Tramo needs")).toHaveStyle({ width: "55%" });
		expect(view.getByLabelText("Tramo wants")).toHaveStyle({ width: "11%" });
		expect(view.getByLabelText("Tramo savings")).toHaveStyle({ width: "34%" });
		expect(view.getByText("Necesidades, Gustos y Ahorro")).toBeTruthy();
		expect(view.getByText("3")).toBeTruthy();
		expect(view.getByText("Alquiler vence mañana")).toBeTruthy();
		expect(view.getByText("S/ 1,265")).toBeTruthy();
		expect(view.getByText("Fondo + 2 metas activas")).toBeTruthy();
		expect(view.getByText("S/ 4,320")).toBeTruthy();
		expect(view.getByText("50 / 30 / 20 · Mensual · día 1")).toBeTruthy();
		expect(view.queryByText("Mover dinero entre sobres")).toBeNull();
		expect(view.queryByText("Automatizaciones")).toBeNull();
		expect(view.queryByRole("button", { name: "Reparto del ciclo" })).toBeNull();

		await act(async () => {
			fireEvent.press(view.getByRole("button", { name: "Sobres" }));
			fireEvent.press(view.getByRole("button", { name: "Compromisos" }));
			fireEvent.press(view.getByRole("button", { name: "Ahorro y metas" }));
		});
		expect(onOpenSobres).toHaveBeenCalledTimes(1);
		expect(onOpenCommitments).toHaveBeenCalledTimes(1);
		expect(onOpenAhorro).toHaveBeenCalledTimes(1);
	});

	it("sin ciclo oculta el total, el mes y el conteo, y las filas siguen", async () => {
		const { view, onOpenSobres } = await renderHub({
			model: {
				...model,
				cycleLabel: null,
				totalLabel: null,
				segments: null,
				envelopeCount: null,
				commitmentsSubtitle: "Sin compromisos",
				commitmentsTone: "plain",
				commitmentsTotal: "S/ 0",
			},
		});
		expect(view.queryByText("TOTAL REPARTIDO")).toBeNull();
		expect(view.queryByText("CICLO AGOSTO")).toBeNull();
		expect(view.queryByText("3")).toBeNull();
		expect(view.getByText("Sin compromisos")).toBeTruthy();
		await act(async () => {
			fireEvent.press(view.getByRole("button", { name: "Sobres" }));
		});
		expect(onOpenSobres).toHaveBeenCalledTimes(1);
	});

	it("cargando y vacío no inventan cifras", async () => {
		const loading = await renderHub({ status: "loading", model: null, ahorro: null });
		expect(loading.view.getByText("Cargando…")).toBeTruthy();
		expect(loading.view.queryByText("TOTAL REPARTIDO")).toBeNull();
		expect(loading.view.queryByText("Sobres")).toBeNull();

		await loading.view.unmount();
		const empty = await renderHub({ status: "empty", model: null, ahorro: null });
		expect(empty.view.getByText("Plan")).toBeTruthy();
		expect(empty.view.queryByText("TOTAL REPARTIDO")).toBeNull();
		expect(empty.view.queryByText("S/ 2,069")).toBeNull();
		expect(empty.view.queryByText("Sobres")).toBeNull();
	});
});
