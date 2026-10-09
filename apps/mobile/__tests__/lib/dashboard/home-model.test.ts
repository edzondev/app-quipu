import { fixtureId } from "@/__fixtures__/convex-id";
import { commitment, summaryWithoutCycle } from "@/__fixtures__/dashboard-summary";
import { mapDashboardHome } from "@/shared/lib/dashboard/home-model";

const AUGUST_START = Date.UTC(2026, 7, 1, 5, 0, 0);
const TODAY_MOVE = Date.UTC(2026, 7, 15, 15, 0, 0);
const YESTERDAY_MOVE = Date.UTC(2026, 7, 14, 15, 0, 0);

type Summary = Parameters<typeof mapDashboardHome>[0];
type ActiveSummary = Extract<Summary, { cycle: { startDate: number } }>;
type Hero = NonNullable<ActiveSummary["hero"]>;
const hero: Hero = {
	dailyAvailableCents: 4230,
	displayDailyCents: 4230,
	bodyCopy: undefined,
	validationCopy: undefined,
	statusBadge: "stable",
	spendableCents: 0,
	reservedCents: 0,
	unallocatedCents: 0,
};

function summary(
	overrides: {
		hero?: Hero;
		envelopes?: ActiveSummary["envelopes"];
		movements?: ActiveSummary["movements"];
		commitments?: ActiveSummary["commitments"];
	} = {},
): ActiveSummary {
	return {
		profile: {
			name: "Edzon",
			currencyCode: "PEN",
			plan: "free",
			allocationNeeds: 50,
			allocationWants: 30,
			allocationSavings: 20,
		},
		cycle: {
			id: fixtureId("financialCycles", "cycle"),
			startDate: AUGUST_START,
			endDate: AUGUST_START,
			needsReview: false,
			unallocatedCents: 0,
			daysTotal: 30,
			daysRemaining: 15,
			daysElapsed: 15,
			progressPercent: 50,
		},
		hero: overrides.hero ?? hero,
		liquidity: {
			spendableCents: 0,
			reservedCents: 0,
			unallocatedCents: 0,
			savingsParkedInEnvelopeCents: 0,
		},
		envelopes: overrides.envelopes ?? [
			{
				type: "needs" as const,
				allocatedAmount: 175000,
				remainingAmount: 61200,
				percentRemaining: 35,
			},
			{
				type: "wants" as const,
				allocatedAmount: 105000,
				remainingAmount: 23100,
				percentRemaining: 22,
			},
			{
				type: "savings" as const,
				allocatedAmount: 70000,
				remainingAmount: 70000,
				percentRemaining: 100,
			},
		],
		coach: {
			kind: "tranquil",
			message: "Vas bien.",
			interactionId: undefined,
			options: undefined,
			crisisOptions: undefined,
			crisisPlan: undefined,
			rescueSuggestion: undefined,
			awaitingRescueConfirmation: false,
		},
		commitments: overrides.commitments ?? [],
		movements: overrides.movements ?? [
			{
				id: "e1",
				kind: "expense" as const,
				label: "Menú del día",
				amount: 1500,
				timestamp: TODAY_MOVE,
				envelopeLabel: "Gustos",
			},
			{
				id: "e0",
				kind: "expense" as const,
				label: "Ayer",
				amount: 500,
				timestamp: YESTERDAY_MOVE,
				envelopeLabel: "Necesidades",
			},
		],
		isEarlyCycle: false,
	};
}

describe("mapDashboardHome", () => {
	it("devuelve null si no hay ciclo activo", () => {
		expect(mapDashboardHome(summaryWithoutCycle)).toBeNull();
	});

	it("mapea el héroe, el ciclo y el coach sin datos ficticios", () => {
		const home = mapDashboardHome(summary());
		expect(home).toMatchObject({
			cycleLabel: "Ciclo agosto",
			cycleDay: 15,
			cycleTotal: 30,
			daysLeft: 15,
			cycleProgress: 50,
			badgeLabel: "Estable",
			badgeTone: "stable",
			cycleStatusLabel: "Ciclo estable",
			dailyCents: 4230,
			heroSubtitle: "Sin tocar tus compromisos ni tu ahorro.",
			coachMessage: "Vas bien.",
			currencySymbol: "S/",
			surplusCents: 154300,
			commitments: [],
		});
	});

	it("traduce los otros estados del ciclo", () => {
		expect(
			mapDashboardHome(
				summary({
					hero: { ...hero, displayDailyCents: 0, statusBadge: "risk" },
				}),
			)?.badgeLabel,
		).toBe("En riesgo");
		expect(
			mapDashboardHome(
				summary({
					hero: {
						...hero,
						displayDailyCents: 0,
						statusBadge: "starting",
						bodyCopy: "Registra tu primer gasto.",
					},
				}),
			),
		).toMatchObject({
			badgeLabel: "Recién empiezas",
			cycleStatusLabel: "Recién empiezas",
			heroSubtitle: "Registra tu primer gasto.",
		});
	});

	it("muestra gastado contra asignado y deja el ahorro como apartado", () => {
		const home = mapDashboardHome(summary());
		expect(home?.envelopes).toEqual([
			{
				label: "Necesidades",
				shortLabel: "Necesid.",
				spentCents: 113800,
				remainingCents: 61200,
				remainingPercent: 35,
				totalCents: 175000,
				progress: 65,
				tone: "needs",
				suffix: "de 1,750",
			},
			{
				label: "Gustos",
				shortLabel: "Gustos",
				spentCents: 81900,
				remainingCents: 23100,
				remainingPercent: 22,
				totalCents: 105000,
				progress: 78,
				tone: "wants",
				suffix: "de 1,050",
			},
			{
				label: "Ahorro",
				shortLabel: "Ahorro",
				spentCents: 70000,
				remainingCents: 70000,
				remainingPercent: 100,
				totalCents: 70000,
				progress: 100,
				tone: "savings",
				suffix: "apartado",
			},
		]);
		expect(home?.envelopesBalanceCents).toBe(154300);
	});

	it("acota la barra si el sobre quedó en negativo", () => {
		const home = mapDashboardHome(
			summary({
				envelopes: [
					{
						type: "needs",
						allocatedAmount: 1000,
						remainingAmount: -500,
						percentRemaining: 0,
					},
				],
			}),
		);
		expect(home?.envelopes[0]).toMatchObject({
			spentCents: 1500,
			remainingCents: -500,
			remainingPercent: 0,
			totalCents: 1000,
			progress: 100,
		});
		expect(home?.surplusCents).toBe(0);
	});

	it("lista los movimientos recientes del resumen", () => {
		const home = mapDashboardHome(summary());
		expect(home?.recentMovements).toEqual([
			{
				id: "e1",
				name: "Menú del día",
				amountCents: 1500,
				tone: "wants",
			},
			{
				id: "e0",
				name: "Ayer",
				amountCents: 500,
				tone: "needs",
			},
		]);
	});

	it("marca un ingreso sin sobre como ingreso, no como gasto", () => {
		const home = mapDashboardHome(
			summary({
				movements: [
					{
						id: "i1",
						kind: "income",
						label: "Sueldo",
						amount: 350000,
						timestamp: TODAY_MOVE,
						envelopeLabel: undefined,
					},
				],
			}),
		);
		expect(home?.recentMovements).toEqual([
			{ id: "i1", name: "Sueldo", amountCents: 350000, tone: "income" },
		]);
	});

	it("arma los próximos compromisos sin filas pagadas ni montos vacíos", () => {
		const home = mapDashboardHome(
			summary({
				commitments: [
					commitment({
						id: "paid",
						name: "Netflix",
						amount: 3000,
						nextDueAt: Date.UTC(2026, 7, 16, 17, 0, 0),
						daysUntilDue: 1,
						paymentStatus: "paid",
					}),
					commitment({
						id: "rent",
						name: "Alquiler",
						amount: 110000,
						nextDueAt: Date.UTC(2026, 7, 16, 17, 0, 0),
						daysUntilDue: 1,
						paymentStatus: "pending",
					}),
					commitment({
						id: "light",
						name: "Luz del Sur",
						amount: 9600,
						nextDueAt: Date.UTC(2026, 7, 22, 17, 0, 0),
						daysUntilDue: 7,
						paymentStatus: "pending",
					}),
					commitment({
						id: "late",
						name: "Agua",
						amount: 4500,
						nextDueAt: Date.UTC(2026, 7, 10, 17, 0, 0),
						daysUntilDue: -5,
						paymentStatus: "overdue",
					}),
				],
			}),
		);
		expect(home?.commitments).toEqual([
			{
				id: "late",
				name: "Agua",
				amountCents: 4500,
				dueLabel: "vencido",
				dueTone: "soon",
			},
			{
				id: "rent",
				name: "Alquiler",
				amountCents: 110000,
				dueLabel: "mañana",
				dueTone: "soon",
			},
			{
				id: "light",
				name: "Luz del Sur",
				amountCents: 9600,
				dueLabel: "22 ago",
				dueTone: "later",
			},
		]);
		expect(JSON.stringify(home?.commitments)).not.toContain("—");
	});
});
