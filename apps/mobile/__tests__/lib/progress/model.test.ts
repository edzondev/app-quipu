import { closeReport, progressOverview, progressRewards } from "@/__fixtures__/progress";
import { savingsOverview } from "@/__fixtures__/savings-overview";
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
const SEP = Date.parse("2026-09-15T17:00:00.000Z");

describe("presentProgress", () => {
	it("arma la racha, los meses cortos, DESDE y los contadores", () => {
		const model = presentProgress(progressOverview, progressRewards, savingsOverview, null);

		expect(model.empty).toBe(false);
		expect(model.streakLabel).toBe("3");
		expect(model.bars).toEqual([
			{ key: String(MAY), tone: "compliant", monthLabel: "MAY" },
			{ key: String(SEP), tone: "warning", monthLabel: "SEP" },
		]);
		expect(model.sinceLabel).toBe("DESDE MAYO");
		expect(model.savedLabel).toBe("S/ 4,320");
		expect(model.registeredExpenseLabel).toBe("312");
		expect(model.daysWithoutSkippingLabel).toBe("46");
		expect(model.achievements).toEqual([
			{ key: "first_cycle_closed", title: "Primer ciclo cerrado", done: true, detail: "MAYO" },
			{
				key: "emergency_fund_25",
				title: "Fondo al 25%",
				done: false,
				detail: "Te falta S/ 200 para el 25%",
			},
		]);
		expect(model.rewardText).toBe("Acento Arcilla a los 6 ciclos");
		expect(model.closeEntry).toBeNull();
		expect(JSON.stringify(model)).not.toContain("Quipu Plus");
	});

	it("etiqueta con cycleStart aunque monthLabel sea null, incluida la barra current", () => {
		const model = presentProgress(
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
		);

		expect(model.bars).toEqual([
			{ key: String(MAY), tone: "compliant", monthLabel: "MAY" },
			{ key: String(SEP), tone: "current", monthLabel: "SEP" },
		]);
		expect(model.sinceLabel).toBe("DESDE MAYO");
	});

	it("omite DESDE si ningún ciclo trae mes", () => {
		const model = presentProgress(
			{
				...progressOverview,
				chartBars: [
					{ id: -1, status: "empty", heightPx: 0, cycleStart: null, monthLabel: null },
					{
						id: MAY,
						status: "failed",
						heightPx: 18,
						cycleStart: null,
						monthLabel: null,
					},
				],
			} satisfies Overview,
			progressRewards,
			savingsOverview,
			null,
		);

		expect(model.bars).toEqual([{ key: String(MAY), tone: "failed", monthLabel: null }]);
		expect(model.sinceLabel).toBeNull();
	});

	it("queda vacío cuando la única barra es el ciclo en curso", () => {
		const model = presentProgress(
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
			{
				...progressRewards,
				rewards: progressRewards.rewards.map((reward) => ({ ...reward, unlocked: true })),
			} satisfies Rewards,
			null,
			null,
		);

		expect(model.empty).toBe(true);
		expect(model.sinceLabel).toBeNull();
		expect(model.bars).toEqual([{ key: String(SEP), tone: "current", monthLabel: "SEP" }]);
	});

	it("queda vacío sin racha ni ciclos", () => {
		const model = presentProgress(
			{
				...progressOverview,
				currentStreak: 0,
				chartBars: [{ id: -1, status: "empty", heightPx: 0, cycleStart: null, monthLabel: null }],
				achievements: [],
			} satisfies Overview,
			{
				...progressRewards,
				rewards: progressRewards.rewards.map((reward) => ({ ...reward, unlocked: true })),
			} satisfies Rewards,
			null,
			null,
		);

		expect(model.empty).toBe(true);
		expect(model.bars).toEqual([]);
		expect(model.sinceLabel).toBeNull();
		expect(model.savedLabel).toBeNull();
		expect(model.rewardText).toBeNull();
	});

	it("muestra el cierre solo cuando el query trae reporte", () => {
		expect(
			presentProgress(progressOverview, progressRewards, savingsOverview, null).closeEntry,
		).toBeNull();
		expect(
			presentProgress(progressOverview, progressRewards, savingsOverview, closeReport).closeEntry,
		).toEqual({
			label: "CICLO CERRADO · JULIO",
			highlighted: true,
		});
	});
});

describe("presentClose", () => {
	it("calcula el sobrante y omite desvíos y la acción sin origen", () => {
		const model = presentClose(closeReport, savingsOverview);

		expect(model?.title).toBe("Cerraste julio con S/ 210 de sobra.");
		expect(model?.subtitle).toBe("3 ciclos seguidos.");
		expect(model?.spentLabel).toBe("GASTADO S/ 3,290");
		expect(model?.surplusLabel).toBe("SOBRÓ S/ 210");
		expect(model?.rows.map((row) => row.amountLabel)).toEqual(["S/ 2,000", "S/ 1,000", "S/ 290"]);
		expect(model?.segments.map((segment) => segment.percent)).toEqual([57, 29, 8, 6]);
		expect(model?.segments.map((segment) => segment.label)).toEqual([
			"Necesidades",
			"Gustos",
			"Ahorro",
			"Sobró",
		]);
		expect(JSON.stringify(model)).not.toContain("%");
		expect(JSON.stringify(model)).not.toContain("cycle-1");
	});

	it("omite el tramo de un sobre con gasto 0", () => {
		const model = presentClose(
			{
				...closeReport,
				report: {
					...closeReport.report,
					totalIncomeCents: 350000,
					spendByEnvelope: [
						{ type: "needs" as const, label: "Necesidades", spentCents: 0 },
						{ type: "wants" as const, label: "Gustos", spentCents: 100000 },
						{ type: "savings" as const, label: "Ahorro", spentCents: 29000 },
					],
				},
			} satisfies ClosePayload,
			savingsOverview,
		);

		expect(model?.segments.map((segment) => segment.tone)).toEqual(["wants", "savings", "surplus"]);
		expect(model?.segments.every((segment) => segment.percent > 0)).toBe(true);
	});

	it("el subtítulo sigue a la racha aunque el estado sea aviso o fallo", () => {
		const warning = presentClose(
			{
				...closeReport,
				report: { ...closeReport.report, status: "warning", streak: 2 },
			} satisfies ClosePayload,
			savingsOverview,
		);
		const failed = presentClose(
			{
				...closeReport,
				report: { ...closeReport.report, status: "failed", streak: 0 },
			} satisfies ClosePayload,
			savingsOverview,
		);
		expect(warning?.subtitle).toBe("2 ciclos seguidos.");
		expect(failed?.subtitle).toBe("La racha vuelve a empezar.");
	});

	it("titula sin cifra cuando no sobra", () => {
		const model = presentClose(
			{
				...closeReport,
				report: {
					...closeReport.report,
					totalIncomeCents: 329000,
				},
			} satisfies ClosePayload,
			savingsOverview,
		);

		expect(model?.title).toBe("Cerraste julio.");
		expect(model?.surplusLabel).toBeNull();
	});

	it("devuelve null sin reporte", () => {
		expect(presentClose(null, savingsOverview)).toBeNull();
	});
});
