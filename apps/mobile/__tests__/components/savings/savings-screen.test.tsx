import { cleanup, fireEvent, render } from "@testing-library/react-native";
import { SavingsScreen } from "@/shared/components/savings/savings-screen";
import { presentAhorro } from "@/shared/lib/savings/model";

const fund = {
	label: "Fondo de emergencia",
	currentAmount: 185000,
	targetAmount: 450000,
	monthlyEssentialsCents: 150000,
	monthsCovered: 1.233,
	monthsCoveredCopy: "1.2 de 3 meses cubiertos · vas seguro",
	cycleContributionCents: 50000,
};

const filled = presentAhorro(
	{
		profile: { currencyCode: "PEN" },
		totalSavedCents: 305000,
		cycleContributionCents: 70000,
		emergencyFund: fund,
		goals: [
			{
				id: "goal-secret",
				label: "Viaje",
				currentAmount: 120000,
				targetAmount: 200000,
			},
		],
		canCreateGoal: true,
	},
	{ emergencyFund: fund },
	{
		sources: {
			needs: { availableCents: 0 },
			wants: { availableCents: 9600 },
			extraordinary: { availableCents: 0 },
		},
		destinations: [{ id: "fund-secret", label: "Fondo de emergencia", isSystemDefault: true }],
	},
);

const screenProps = {
	status: "ready" as const,
	surplusDismissed: false,
	movingSurplus: false,
	moveError: null,
	onBack: jest.fn(),
	onAddGoal: jest.fn(),
	onMoveSurplus: jest.fn(),
	onDismissSurplus: jest.fn(),
};

describe("SavingsScreen", () => {
	afterEach(() => {
		cleanup();
	});

	it("muestra fondo, meta sin activar y el banner con el monto de Convex", async () => {
		const onMoveSurplus = jest.fn();
		const onAddGoal = jest.fn();
		const view = await render(
			<SavingsScreen
				{...screenProps}
				model={filled}
				onMoveSurplus={onMoveSurplus}
				onAddGoal={onAddGoal}
			/>,
		);

		expect(view.getByText("Ahorro")).toBeTruthy();
		expect(view.getByText("TOTAL S/ 3,050")).toBeTruthy();
		expect(view.getByText("Guardas S/ 700 cada ciclo. Con calma, se nota.")).toBeTruthy();
		expect(view.getByText("Fondo de emergencia")).toBeTruthy();
		expect(view.getByText("S/ 1,850")).toBeTruthy();
		expect(view.getByText("de S/ 4,500 · meta de 3 meses de gastos")).toBeTruthy();
		expect(view.getByText("1.2 DE 3 MESES CUBIERTOS")).toBeTruthy();
		expect(view.getByText("+S/ 500 / CICLO")).toBeTruthy();
		expect(view.getByText("TUS METAS")).toBeTruthy();
		expect(view.getByText("Viaje")).toBeTruthy();
		expect(view.getByText("S/ 1,200 de 2,000")).toBeTruthy();
		expect(view.getByText("SIN APORTE AUTOMÁTICO")).toBeTruthy();
		expect(view.queryByText("ACTIVAR")).toBeNull();
		expect(view.queryByText("goal-secret")).toBeNull();
		expect(view.queryByText("fund-secret")).toBeNull();
		expect(
			view.getByText("Te sobrarán ~S/ 96 al cerrar el ciclo. ¿Los mando al Fondo?"),
		).toBeTruthy();

		expect(fillWidth(view.getByLabelText("Avance del fondo, 41 por ciento"))).toBe("41%");
		expect(fillWidth(view.getByLabelText("Avance de Viaje, 60 por ciento"))).toBe("60%");

		await fireEvent.press(view.getByLabelText("Sí, moverlos"));
		expect(onMoveSurplus).toHaveBeenCalledTimes(1);
		await fireEvent.press(view.getByLabelText("Nueva meta"));
		expect(onAddGoal).toHaveBeenCalledTimes(1);
	});

	it("oculta el banner al descartarlo", async () => {
		const onDismissSurplus = jest.fn();
		const view = await render(
			<SavingsScreen {...screenProps} model={filled} onDismissSurplus={onDismissSurplus} />,
		);

		await fireEvent.press(view.getByLabelText("Ahora no"));
		expect(onDismissSurplus).toHaveBeenCalledTimes(1);

		await view.rerender(
			<SavingsScreen
				{...screenProps}
				model={filled}
				surplusDismissed
				onDismissSurplus={onDismissSurplus}
			/>,
		);
		expect(
			view.queryByText("Te sobrarán ~S/ 96 al cerrar el ciclo. ¿Los mando al Fondo?"),
		).toBeNull();
	});

	it("centra el vacío sin ofrecer una acción que Convex no permite", async () => {
		const model = presentAhorro(
			{
				profile: { currencyCode: "PEN" },
				totalSavedCents: 0,
				cycleContributionCents: 0,
				emergencyFund: null,
				goals: [],
				canCreateGoal: false,
			},
			null,
			null,
		);
		const view = await render(<SavingsScreen {...screenProps} model={model} />);

		expect(view.getByText("El fondo va primero.")).toBeTruthy();
		expect(
			view.getByText("Aparece cuando terminas de armar tu sistema. Las metas se suman después."),
		).toBeTruthy();
		expect(view.queryByText("Nueva meta")).toBeNull();
		expect(view.queryByText("ACTIVAR")).toBeNull();
		expect(view.queryByText("TUS METAS")).toBeNull();
	});
});

function fillWidth(node: { props: { children?: { props?: { style?: { width?: string } } } } }) {
	return node.props.children?.props?.style?.width;
}
