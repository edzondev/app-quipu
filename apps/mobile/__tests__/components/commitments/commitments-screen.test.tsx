import { cleanup, fireEvent, render } from "@testing-library/react-native";
import { CommitmentsScreen } from "@/shared/components/commitments/commitments-screen";
import type { CommitmentsScreenModel } from "@/shared/lib/commitments/model";

const filled: CommitmentsScreenModel = {
	totalLabel: "S/ 1,265",
	paidLabel: "PAGADO S/ 165",
	pendingLabel: "PENDIENTE S/ 1,100",
	paidPercent: 13,
	rows: [
		{
			id: "rent-secret",
			name: "Alquiler",
			meta: "VENCE MAÑANA · 16 AGO",
			metaTone: "soon",
			amountLabel: "S/ 1,100",
			amountMuted: false,
			statusLabel: "Cubierto",
			statusTone: "calm",
		},
		{
			id: "phone-secret",
			name: "Celular Entel",
			meta: "PAGADO 6 AGO",
			metaTone: "muted",
			amountLabel: "S/ 59",
			amountMuted: true,
			statusLabel: "Pagado",
			statusTone: "muted",
		},
	],
};

describe("CommitmentsScreen", () => {
	afterEach(() => {
		cleanup();
	});

	it("muestra reservado, filas y el CTA outline", async () => {
		const onAdd = jest.fn();
		const view = await render(
			<CommitmentsScreen status="ready" model={filled} onBack={jest.fn()} onAdd={onAdd} />,
		);

		expect(view.getByText("Compromisos")).toBeTruthy();
		expect(
			view.getByText("Quipu los reserva de Necesidades antes de calcular tu disponible."),
		).toBeTruthy();
		expect(view.getByText("RESERVADO ESTE CICLO")).toBeTruthy();
		expect(view.getByText("S/ 1,265")).toBeTruthy();
		expect(view.getByText("PAGADO S/ 165")).toBeTruthy();
		expect(view.getByText("PENDIENTE S/ 1,100")).toBeTruthy();
		expect(view.getByText("VENCE MAÑANA · 16 AGO")).toBeTruthy();
		expect(view.getByText("Cubierto")).toBeTruthy();
		expect(view.getByText("PAGADO 6 AGO")).toBeTruthy();
		expect(view.getByText("Pagado")).toBeTruthy();
		expect(view.queryByText("rent-secret")).toBeNull();
		expect(view.queryByText("phone-secret")).toBeNull();

		await fireEvent.press(view.getByText("Agregar compromiso"));
		expect(onAdd).toHaveBeenCalledTimes(1);
	});

	it("muestra el vacío 2b con el CTA sólido", async () => {
		const onAdd = jest.fn();
		const view = await render(
			<CommitmentsScreen
				status="ready"
				model={{
					totalLabel: "S/ 0",
					paidLabel: "PAGADO S/ 0",
					pendingLabel: "PENDIENTE S/ 0",
					paidPercent: 0,
					rows: [],
				}}
				onBack={jest.fn()}
				onAdd={onAdd}
			/>,
		);

		expect(view.getByText("SIN COMPROMISOS")).toBeTruthy();
		expect(view.getByText("Aún no registras tus pagos fijos.")).toBeTruthy();
		expect(view.getByText("S/ 0")).toBeTruthy();
		expect(view.queryByText("PAGADO S/ 0")).toBeNull();
		await fireEvent.press(view.getByText("Agregar compromiso"));
		expect(onAdd).toHaveBeenCalledTimes(1);
	});

	it("carga sin inventar filas", async () => {
		const view = await render(
			<CommitmentsScreen status="loading" model={null} onBack={jest.fn()} onAdd={jest.fn()} />,
		);
		expect(view.getByText("Cargando…")).toBeTruthy();
		expect(view.queryByText("Agregar compromiso")).toBeNull();
	});
});
