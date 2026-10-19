import {
	commitment,
	envelope,
	idleCommitment,
	summaryWithCycle,
	summaryWithoutCycle,
} from "@/__fixtures__/dashboard-summary";
import { settingsOverview } from "@/__fixtures__/settings-overview";
import { presentPlanHub } from "@/shared/lib/plan/model";

const settings = settingsOverview();
const NEEDS_OVERSPENT = 47_467;

function withSnapshot(
	summary: ReturnType<typeof summaryWithCycle>,
	patch: {
		needsOverspentCents?: number;
		wantsOverspentCents?: number;
		savingsParkedInEnvelopeCents?: number;
	},
) {
	const { savingsParkedInEnvelopeCents, ...overspent } = patch;
	return {
		...summary,
		hero: { ...summary.hero, ...overspent },
		liquidity: {
			...summary.liquidity,
			...overspent,
			...(savingsParkedInEnvelopeCents == null ? {} : { savingsParkedInEnvelopeCents }),
		},
	};
}

describe("presentPlanHub", () => {
	it("suma lo que queda y reparte la barra cuando ningún sobre se pasó", () => {
		const model = presentPlanHub(summaryWithCycle(), settings);
		expect(model.cycleLabel).toBe("CICLO AGOSTO");
		expect(model.totalLabel).toBe("S/ 2,069");
		expect(model.envelopeCount).toBe("3");
		expect(model.overspent).toEqual([]);
		expect(model.plannedSavingsLabel).toBe("S/ 0");
		expect(model.segments).toEqual([
			{ tone: "needs", percent: 55 },
			{ tone: "wants", percent: 11 },
			{ tone: "savings", percent: 34 },
		]);
		expect(model.repartoSubtitle).toBe("50 / 30 / 20 · Mensual · día 1");

		const thirds = presentPlanHub(
			summaryWithCycle({
				envelopes: [envelope("needs", 1), envelope("wants", 1), envelope("savings", 1)],
			}),
			null,
		);
		expect(thirds.segments).toEqual([
			{ tone: "needs", percent: 33 },
			{ tone: "wants", percent: 33 },
			{ tone: "savings", percent: 33 },
		]);
		expect(thirds.overspent).toEqual([]);
	});

	it("no inventa Te pasaste si el remaining es negativo y el snapshot trae exceso 0", () => {
		const model = presentPlanHub(
			summaryWithCycle({
				envelopes: [envelope("needs", 113800), envelope("wants", -500), envelope("savings", 70000)],
			}),
			null,
		);
		expect(model.overspent).toEqual([]);
		expect(model.totalLabel).toBe("S/ 1,833");
		expect(model.segments).toEqual([
			{ tone: "needs", percent: 62 },
			{ tone: "wants", percent: 0 },
			{ tone: "savings", percent: 38 },
		]);
	});

	it("lee el exceso del snapshot: Necesidades −S/ 474.67, sin recalcular remaining", () => {
		const model = presentPlanHub(
			withSnapshot(
				summaryWithCycle({
					envelopes: [envelope("needs", 0), envelope("wants", 23_100), envelope("savings", 70_000)],
				}),
				{ needsOverspentCents: NEEDS_OVERSPENT, wantsOverspentCents: 0 },
			),
			null,
		);
		expect(model.overspent).toEqual([
			{ tone: "needs", label: "Necesidades", amountLabel: "\u2212S/ 474.67" },
		]);
		expect(model.totalLabel).toBe("S/ 931");
		expect(model.segments).toEqual([
			{ tone: "needs", percent: 0 },
			{ tone: "wants", percent: 25 },
			{ tone: "savings", percent: 75 },
		]);
	});

	it("separa ahorro planeado del snapshot y no lo mezcla con el remaining del sobre", () => {
		const model = presentPlanHub(
			withSnapshot(summaryWithCycle(), { savingsParkedInEnvelopeCents: 70_000 }),
			null,
		);
		expect(model.plannedSavingsLabel).toBe("S/ 700");
		expect(model.totalLabel).toBe("S/ 2,069");
	});

	it("describe las seis variantes del próximo compromiso", () => {
		const subtitle = (commitments: ReturnType<typeof commitment>[]) =>
			presentPlanHub(summaryWithCycle({ commitments }), null);

		expect(
			subtitle([
				commitment({ id: "later", name: "Luz", amount: 1000, daysUntilDue: 4 }),
				commitment({ id: "over", name: "Alquiler", amount: 2500, daysUntilDue: -2 }),
			]),
		).toMatchObject({
			commitmentsSubtitle: "Alquiler vencido",
			commitmentsTone: "plain",
			commitmentsTotal: "S/ 35",
		});
		expect(
			subtitle([commitment({ id: "today", name: "Luz", amount: 0, daysUntilDue: 0 })]),
		).toMatchObject({ commitmentsSubtitle: "Luz vence hoy", commitmentsTone: "plain" });
		expect(
			subtitle([commitment({ id: "tomorrow", name: "Alquiler", amount: 0, daysUntilDue: 1 })]),
		).toMatchObject({
			commitmentsSubtitle: "Alquiler vence mañana",
			commitmentsTone: "warning",
		});
		expect(
			subtitle([commitment({ id: "soon", name: "Agua", amount: 0, daysUntilDue: 5 })]),
		).toMatchObject({
			commitmentsSubtitle: "Agua vence en 5 días",
			commitmentsTone: "muted",
		});
		expect(
			subtitle([
				commitment({
					id: "paid",
					name: "Luz",
					amount: 400,
					paymentStatus: "paid",
					daysUntilDue: 1,
				}),
			]),
		).toMatchObject({
			commitmentsSubtitle: "Todo pagado este ciclo",
			commitmentsTone: "plain",
			commitmentsTotal: "S/ 4",
		});
		expect(subtitle([])).toMatchObject({
			commitmentsSubtitle: "Sin compromisos",
			commitmentsTone: "plain",
			commitmentsTotal: "S/ 0",
		});
	});

	it("sin ciclo activo no inventa total, mes ni conteo", () => {
		const noCycle = {
			...summaryWithoutCycle,
			commitments: [idleCommitment({ id: "today", name: "Luz", amount: 500, daysUntilDue: 0 })],
		} satisfies typeof summaryWithoutCycle;
		const model = presentPlanHub(noCycle, settings);
		expect(model.cycleLabel).toBeNull();
		expect(model.totalLabel).toBeNull();
		expect(model.segments).toBeNull();
		expect(model.envelopeCount).toBeNull();
		expect(model.commitmentsSubtitle).toBe("Luz vence hoy");
		expect(model.commitmentsTotal).toBe("S/ 5");
		expect(model.repartoSubtitle).toBe("50 / 30 / 20 · Mensual · día 1");
		expect(model.overspent).toEqual([]);
		expect(model.plannedSavingsLabel).toBeNull();
	});
});
