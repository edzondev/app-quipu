import { act, fireEvent, render } from "@testing-library/react-native";
import type { TestInstance } from "test-renderer";
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
	overspent: [],
	plannedSavingsLabel: "S/ 700",
	commitmentsSubtitle: "Alquiler vence mañana",
	commitmentsTone: "warning",
	commitmentsTotal: "S/ 1,265",
};

function rowClassName(node: TestInstance): string {
	let current: TestInstance | null = node;
	while (current) {
		const className = current.props.className;
		if (typeof className === "string" && className.includes("justify-between")) return className;
		current = current.parent;
	}
	throw new Error("row class missing");
}

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
		expect(view.getByText("Ahorro planeado")).toBeTruthy();
		expect(view.getByText("S/ 700")).toBeTruthy();
		expect(view.getByText("Ahorro ya guardado")).toBeTruthy();
		expect(view.getByText("Fondo de emergencia y metas")).toBeTruthy();
		expect(view.getByText("S/ 4,320")).toBeTruthy();
		expect(view.queryByText("Ahorro y metas")).toBeNull();
		expect(view.queryByText("Fondo + 2 metas activas")).toBeNull();
		expect(view.queryByText("Te pasaste")).toBeNull();
		expect(view.queryByText("Reparto del ciclo")).toBeNull();
		expect(view.queryByText("Automatizaciones")).toBeNull();
		expect(rowClassName(view.getByText("Ahorro ya guardado"))).not.toContain("border-b");
		expect(rowClassName(view.getByText("Ahorro planeado"))).toContain("border-b");
		expect(view.queryByText("Cubrir el exceso")).toBeNull();

		await act(async () => {
			fireEvent.press(view.getByRole("button", { name: "Sobres" }));
			fireEvent.press(view.getByRole("button", { name: "Compromisos" }));
			fireEvent.press(view.getByRole("button", { name: "Ahorro ya guardado" }));
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
				plannedSavingsLabel: null,
				commitmentsSubtitle: "Sin compromisos",
				commitmentsTone: "plain",
				commitmentsTotal: "S/ 0",
			},
		});
		expect(view.queryByText("TOTAL REPARTIDO")).toBeNull();
		expect(view.queryByText("CICLO AGOSTO")).toBeNull();
		expect(view.queryByText("3")).toBeNull();
		expect(view.queryByText("Ahorro planeado")).toBeNull();
		expect(view.getByText("Ahorro ya guardado")).toBeTruthy();
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

	it("pinta Necesidades −S/ 474.67 como Te pasaste en rojo, sin fondo rojo ni botón de cubrir", async () => {
		const { view } = await renderHub({
			model: {
				...model,
				overspent: [{ tone: "needs", label: "Necesidades", amountLabel: "\u2212S/ 474.67" }],
			},
		});
		expect(view.getByText("Necesidades")).toBeTruthy();
		expect(view.getByText("Te pasaste")).toBeTruthy();
		expect(view.getByText("\u2212S/ 474.67")).toBeTruthy();
		expect(view.getByText("Te pasaste").props.className).toContain("text-danger");
		expect(view.getByText("Te pasaste").props.className).not.toMatch(/bg-danger|bg-warning/);
		expect(view.getByText("\u2212S/ 474.67").props.className).toContain("text-danger");
		expect(view.getByText("\u2212S/ 474.67").props.className).not.toMatch(/bg-danger|bg-warning/);
		expect(view.queryByText("Cubrir el exceso")).toBeNull();
		expect(view.queryByRole("button", { name: "Necesidades" })).toBeNull();
	});
});
