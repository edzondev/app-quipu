import { cleanup, fireEvent, render } from "@testing-library/react-native";
import { fixtureId } from "@/__fixtures__/convex-id";
import { savingsOverview } from "@/__fixtures__/savings-overview";
import { CloseScreen } from "@/shared/components/progress/close-screen";
import { ProgressScreen } from "@/shared/components/progress/progress-screen";
import {
	type CloseReportResult,
	type ProgressOverview,
	type ProgressRewards,
	presentClose,
	presentProgress,
} from "@/shared/lib/progress/model";

type Overview = NonNullable<ProgressOverview>;
type Rewards = NonNullable<ProgressRewards>;
type ClosePayload = NonNullable<CloseReportResult>;

const MAY = Date.parse("2026-05-15T17:00:00.000Z");

const overview = {
	currentStreak: 3,
	longestStreak: 3,
	chartBars: [{ id: MAY, status: "compliant" as const, heightPx: 26 }],
	achievements: [
		{
			id: "first_cycle_closed" as const,
			title: "Primer ciclo cerrado",
			state: "done" as const,
			earnedAt: MAY,
			lockedHint: null,
		},
	],
	achievementsDoneCount: 1,
	achievementsTotal: 1,
} satisfies Overview;

const rewards = {
	currentStreak: 3,
	appearance: { theme: "light" as const, accent: "moss" as const, appIcon: "light" as const },
	rewards: [
		{
			id: "clay_accent" as const,
			title: "Acento Arcilla",
			description: "Paleta alterna · desbloqueado con 6 ciclos",
			unlocked: false,
			requiredStreak: 6,
			active: false,
		},
	],
	accents: [],
	themes: [],
	appIcons: [],
} satisfies Rewards;

const closeReport = {
	justClosed: false,
	report: {
		closedCycleId: fixtureId("financialCycles", "cycle-secret"),
		cycleLabel: "Julio",
		totalIncomeCents: 10000,
		spendByEnvelope: [{ type: "needs" as const, label: "Necesidades", spentCents: 10000 }],
		savingsCents: 0,
		streak: 1,
		status: "warning" as const,
		hasExtraordinaryIncome: false,
	},
} satisfies ClosePayload;

const screenProps = {
	status: "ready" as const,
	onOpenClose: jest.fn(),
	onOpenPlan: jest.fn(),
};

describe("ProgressScreen", () => {
	afterEach(() => {
		cleanup();
	});

	it("muestra la racha y no ofrece Ver ahorro", async () => {
		const view = await render(
			<ProgressScreen
				{...screenProps}
				model={presentProgress(overview, rewards, savingsOverview, null)}
			/>,
		);

		expect(view.getByText("Progreso")).toBeTruthy();
		expect(view.getByText("3")).toBeTruthy();
		expect(view.getByText("seguidos")).toBeTruthy();
		expect(view.queryByText(/DESDE/)).toBeNull();
		expect(view.getByText("MAYO")).toBeTruthy();
		expect(view.getByText("AHORRADO TOTAL")).toBeTruthy();
		expect(view.getByText("S/ 4,320")).toBeTruthy();
		expect(view.getByText("Primer ciclo cerrado")).toBeTruthy();
		expect(view.getByText("RECOMPENSA")).toBeTruthy();
		expect(view.queryByText("Ver ahorro y metas")).toBeNull();
		expect(view.queryByText("GASTOS REGISTRADOS")).toBeNull();
		expect(view.queryByText("DÍAS SIN SALTAR")).toBeNull();
		expect(view.queryByText("first_cycle_closed")).toBeNull();
	});

	it("centra el vacío y abre Plan", async () => {
		const onOpenPlan = jest.fn();
		const view = await render(
			<ProgressScreen
				{...screenProps}
				onOpenPlan={onOpenPlan}
				model={presentProgress(
					{ ...overview, currentStreak: 0, chartBars: [], achievements: [] } satisfies Overview,
					{ ...rewards, rewards: [] } satisfies Rewards,
					null,
					null,
				)}
			/>,
		);

		expect(view.getByText("Aún no cierras un ciclo.")).toBeTruthy();
		expect(view.queryByText("CICLOS CERRADOS EN VERDE")).toBeNull();
		await fireEvent.press(view.getByLabelText("Ir a Plan"));
		expect(onOpenPlan).toHaveBeenCalledTimes(1);
	});

	it("abre el cierre cuando hay reporte y lo oculta cuando no", async () => {
		const onOpenClose = jest.fn();
		const present = await render(
			<ProgressScreen
				{...screenProps}
				onOpenClose={onOpenClose}
				model={presentProgress(overview, rewards, savingsOverview, closeReport)}
			/>,
		);
		await fireEvent.press(present.getByLabelText("CICLO CERRADO · JULIO"));
		expect(onOpenClose).toHaveBeenCalledTimes(1);

		const absent = await render(
			<ProgressScreen
				{...screenProps}
				model={presentProgress(overview, rewards, savingsOverview, null)}
			/>,
		);
		expect(absent.queryByText("CICLO CERRADO · JULIO")).toBeNull();
	});
});

describe("CloseScreen", () => {
	afterEach(() => {
		cleanup();
	});

	it("oculta mover y los porcentajes cuando el reporte no trae origen ni desvío", async () => {
		const income = {
			...closeReport,
			report: {
				...closeReport.report,
				totalIncomeCents: 350000,
				spendByEnvelope: [
					{ type: "needs" as const, label: "Necesidades", spentCents: 200000 },
					{ type: "wants" as const, label: "Gustos", spentCents: 100000 },
					{ type: "savings" as const, label: "Ahorro", spentCents: 29000 },
				],
			},
		} satisfies ClosePayload;
		const view = await render(
			<CloseScreen
				status="ready"
				model={presentClose(income, savingsOverview)}
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
		expect(view.queryByText("cycle-secret")).toBeNull();
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
