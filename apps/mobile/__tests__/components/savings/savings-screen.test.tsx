import { cleanup, fireEvent, render } from "@testing-library/react-native";
import type { GenericId as Id } from "convex/values";
import { SavingsScreen } from "@/shared/components/savings/savings-screen";
import {
	type MoveSurplusContext,
	presentAhorro,
	type SavingsOverview,
} from "@/shared/lib/savings/model";

type Overview = NonNullable<SavingsOverview>;
type Fund = NonNullable<Overview["emergencyFund"]>;
type Surplus = NonNullable<MoveSurplusContext>;

function subEnvelopeId(id: string): Id<"subEnvelopes"> {
	return id as Id<"subEnvelopes">;
}

const fund = {
	id: subEnvelopeId("fund-1"),
	label: "Fondo de emergencia",
	currentAmount: 185000,
	targetAmount: 450000,
	monthlyEssentialsCents: 150000,
	monthsCovered: 1.233,
	monthsCoveredCopy: "1.2 de 3 meses cubiertos · vas seguro",
	progressPercent: 41,
	cycleContributionCents: 50000,
	cyclesToComplete: 6,
	contributionStreak: 0,
	availableToContributeCents: 0,
} satisfies Fund;

const filledOverview = {
	profile: { name: "Ana", currencyCode: "PEN" },
	hasActiveCycle: true,
	totalSavedCents: 305000,
	cycleContributionCents: 70000,
	emergencyFund: fund,
	goals: [
		{
			id: subEnvelopeId("goal-secret"),
			label: "Viaje",
			currentAmount: 120000,
			targetAmount: 200000,
			progressPercent: 60,
			isSystemDefault: false,
		},
	],
	canCreateGoal: true,
	assignPlan: null,
} satisfies Overview;

const filled = presentAhorro(filledOverview, {
	currencyCode: "PEN",
	sources: {
		needs: { availableCents: 2500 },
		wants: { availableCents: 5000 },
		extraordinary: { availableCents: 9600 },
	},
	destinations: [
		{ id: subEnvelopeId("fund-secret"), label: "Fondo de emergencia", isSystemDefault: true },
	],
} satisfies Surplus);

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

	it("muestra fondo, meta sin activar y el banner de ingreso extra", async () => {
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
		expect(view.getByText("PRIORIDAD")).toBeTruthy();
		expect(view.getByText("Fondo de emergencia")).toBeTruthy();
		expect(view.getByText("1,850")).toBeTruthy();
		expect(view.getByText("de S/ 4,500 · meta de 3 meses de gastos")).toBeTruthy();
		expect(view.getByText("1.2 DE 3 MESES CUBIERTOS")).toBeTruthy();
		expect(view.getByText("+S/ 500 / CICLO")).toBeTruthy();
		expect(view.getByText("TUS METAS")).toBeTruthy();
		expect(view.getByText("Viaje")).toBeTruthy();
		expect(view.getByText("S/ 1,200")).toBeTruthy();
		expect(view.getByText("de 2,000")).toBeTruthy();
		expect(view.getByText("SIN APORTE AUTOMÁTICO")).toBeTruthy();
		expect(view.queryByText("ACTIVAR")).toBeNull();
		expect(view.queryByText("goal-secret")).toBeNull();
		expect(view.queryByText("fund-secret")).toBeNull();
		expect(
			view.getByText("Tienes ~S/ 96 de ingreso extra este ciclo. ¿Los mando al Fondo?"),
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
			view.queryByText("Tienes ~S/ 96 de ingreso extra este ciclo. ¿Los mando al Fondo?"),
		).toBeNull();
	});

	it("no muestra el banner si el ingreso extra es 0", async () => {
		const model = presentAhorro(filledOverview, {
			currencyCode: "PEN",
			sources: {
				needs: { availableCents: 2500 },
				wants: { availableCents: 9600 },
				extraordinary: { availableCents: 0 },
			},
			destinations: [],
		} satisfies Surplus);
		const view = await render(<SavingsScreen {...screenProps} model={model} />);
		expect(view.queryByText(/ingreso extra/)).toBeNull();
		expect(view.queryByLabelText("Sí, moverlos")).toBeNull();
	});

	it("muestra el fondo pendiente y el vacío de metas", async () => {
		const onAddGoal = jest.fn();
		const model = presentAhorro(
			{
				profile: { name: "Ana", currencyCode: "PEN" },
				hasActiveCycle: false,
				totalSavedCents: 0,
				cycleContributionCents: 0,
				emergencyFund: { ...fund, targetAmount: 0, currentAmount: 0 },
				goals: [],
				canCreateGoal: true,
				assignPlan: null,
			} satisfies Overview,
			null,
		);
		const view = await render(
			<SavingsScreen {...screenProps} model={model} onAddGoal={onAddGoal} />,
		);

		expect(view.getByText("TOTAL S/ 0")).toBeTruthy();
		expect(view.getByText("Tu 20% empieza a acumularse con el primer ingreso.")).toBeTruthy();
		expect(view.queryByText("PRIORIDAD")).toBeNull();
		expect(
			view.getByText(
				"Tu primera meta es cubrir 3 meses de gastos. Quipu la calcula cuando conozca tu ciclo.",
			),
		).toBeTruthy();
		expect(view.getByText("TUS METAS")).toBeTruthy();
		expect(view.getByText("SIN METAS")).toBeTruthy();
		expect(view.getByText("Tus metas vivirán aquí.")).toBeTruthy();
		expect(
			view.getByText(
				"Un viaje, una laptop, la inicial del depa. Primero dale tracción al Fondo; las metas vienen después.",
			),
		).toBeTruthy();
		expect(view.getByText("+ Nueva meta")).toBeTruthy();
		expect(view.queryByLabelText(/por ciento/)).toBeNull();

		await fireEvent.press(view.getByLabelText("Crear mi primera meta"));
		expect(onAddGoal).toHaveBeenCalledTimes(1);
	});

	it("oculta crear meta cuando todavía no hay fondo", async () => {
		const model = presentAhorro(
			{
				profile: { name: "Ana", currencyCode: "PEN" },
				hasActiveCycle: false,
				totalSavedCents: 0,
				cycleContributionCents: 0,
				emergencyFund: null,
				goals: [],
				canCreateGoal: false,
				assignPlan: null,
			} satisfies Overview,
			null,
		);
		const view = await render(<SavingsScreen {...screenProps} model={model} />);

		expect(view.queryByText("Crear mi primera meta")).toBeNull();
		expect(view.queryByText("+ Nueva meta")).toBeNull();
		expect(view.queryByLabelText("Crear mi primera meta")).toBeNull();
		expect(view.queryByLabelText("Nueva meta")).toBeNull();
	});
});

function fillWidth(node: { props: { children?: { props?: { style?: { width?: string } } } } }) {
	return node.props.children?.props?.style?.width;
}
