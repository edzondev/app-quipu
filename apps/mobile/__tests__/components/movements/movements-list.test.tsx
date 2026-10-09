import { act, cleanup, fireEvent, render } from "@testing-library/react-native";
import {
	MOVEMENT_SEARCH_DEBOUNCE_MS,
	MovementsList,
} from "@/shared/components/movements/movements-list";

const NOW = Date.parse("2026-08-15T21:00:00-05:00");
const START = Date.parse("2026-08-01T00:00:00-05:00");

const filled = {
	currencyCode: "PEN",
	cycle: { startDate: START, endDate: START + 30 * 24 * 60 * 60 * 1000 },
	movements: [
		Object.assign(
			{
				id: "exp_plaza",
				kind: "expense" as const,
				label: "Plaza Vea",
				amount: 4200,
				timestamp: Date.parse("2026-08-15T19:12:00-05:00"),
				envelopeType: "wants" as const,
				envelopeLabel: "Gustos",
			},
			{ detected: true, envelopeId: "env_secret" },
		),
		{
			id: "in_sueldo",
			kind: "income" as const,
			label: "Sueldo",
			amount: 350_000,
			timestamp: Date.parse("2026-08-01T09:00:00-05:00"),
			occurredAt: Date.parse("2026-08-01T09:00:00-05:00"),
			source: "payroll" as const,
			distributionPolicy: "profile_default" as const,
		},
	],
};

async function press(instance: Parameters<typeof fireEvent.press>[0]) {
	await act(async () => {
		fireEvent.press(instance);
	});
}

async function type(instance: Parameters<typeof fireEvent.changeText>[0], value: string) {
	await act(async () => {
		fireEvent.changeText(instance, value);
	});
}

describe("MovementsList", () => {
	afterEach(() => {
		cleanup();
		jest.useRealTimers();
	});

	it("abre el detalle al tocar un gasto y deja el ingreso quieto", async () => {
		const onOpenExpense = jest.fn();
		const view = await render(
			<MovementsList
				status="ready"
				data={filled}
				now={NOW}
				onOpenExpense={onOpenExpense}
				onCreate={jest.fn()}
			/>,
		);

		expect(view.getByText("HOY · 15 AGO")).toBeTruthy();
		expect(view.getByText("DETECTADO · 19:12")).toBeTruthy();
		expect(view.getByText("REPARTIDO")).toBeTruthy();
		expect(view.queryByText("exp_plaza")).toBeNull();
		expect(view.queryByText("env_secret")).toBeNull();
		expect(view.queryByText("—")).toBeNull();

		await press(view.getByRole("button", { name: /Plaza Vea/ }));
		expect(onOpenExpense).toHaveBeenCalledWith("exp_plaza");
		expect(view.queryByRole("button", { name: /Sueldo/ })).toBeNull();
	});

	it("centra el vacío del ciclo y ofrece registrar", async () => {
		const onCreate = jest.fn();
		const view = await render(
			<MovementsList
				status="ready"
				data={{
					currencyCode: "PEN",
					cycle: filled.cycle,
					movements: [],
				}}
				now={NOW}
				onOpenExpense={jest.fn()}
				onCreate={onCreate}
			/>,
		);

		expect(view.getByText("Todavía no hay nada registrado en este ciclo.")).toBeTruthy();
		expect(
			view.getByText("Cada gasto que registres aparecerá aquí, ordenado por día y con su sobre."),
		).toBeTruthy();
		expect(view.getByText("CICLO 1 – 30 AGO · 0 REGISTROS")).toBeTruthy();
		expect(view.queryByText("—")).toBeNull();
		expect(view.queryByText("Todos")).toBeNull();
		await press(view.getByText("Registrar gasto"));
		expect(onCreate).toHaveBeenCalledTimes(1);
	});

	it("sin ciclo ofrece registrar ingreso", async () => {
		const onCreate = jest.fn();
		const view = await render(
			<MovementsList
				status="ready"
				data={{
					currencyCode: "PEN",
					cycle: null,
					movements: [],
				}}
				now={NOW}
				onOpenExpense={jest.fn()}
				onCreate={onCreate}
			/>,
		);

		expect(view.getByText("Registrar ingreso")).toBeTruthy();
		expect(view.queryByText("Registrar gasto")).toBeNull();
		expect(view.queryByText("—")).toBeNull();
		await press(view.getByText("Registrar ingreso"));
		expect(onCreate).toHaveBeenCalledTimes(1);
	});

	it("filtra por gustos desde los chips", async () => {
		const view = await render(
			<MovementsList
				status="ready"
				data={filled}
				now={NOW}
				onOpenExpense={jest.fn()}
				onCreate={jest.fn()}
			/>,
		);
		expect(view.getByText("Todos")).toBeTruthy();
		expect(view.getByText("Necesidades")).toBeTruthy();
		expect(view.queryByText("Ahorro")).toBeNull();
		expect(view.queryByRole("button", { name: "Ahorro" })).toBeNull();
		await press(view.getByText("Gustos"));
		expect(view.getByText("Plaza Vea")).toBeTruthy();
		expect(view.queryByText("Sueldo")).toBeNull();
		expect(view.queryByText("Ningún movimiento con ese criterio.")).toBeNull();
		expect(view.queryByText("—")).toBeNull();
	});

	it("busca por el nombre del movimiento una vez pasado el debounce", async () => {
		jest.useFakeTimers();
		const view = await render(
			<MovementsList
				status="ready"
				data={filled}
				now={NOW}
				onOpenExpense={jest.fn()}
				onCreate={jest.fn()}
			/>,
		);
		await press(view.getByLabelText("Buscar"));
		await type(view.getByLabelText("Buscar movimientos"), "sueldo");

		expect(view.getByText("Plaza Vea")).toBeTruthy();

		await act(async () => {
			jest.advanceTimersByTime(MOVEMENT_SEARCH_DEBOUNCE_MS);
		});

		expect(view.getByText("Sueldo")).toBeTruthy();
		expect(view.queryByText("Plaza Vea")).toBeNull();
		expect(view.queryByText("exp_plaza")).toBeNull();
	});
});
