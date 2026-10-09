import { fixtureId } from "@/__fixtures__/convex-id";
import { commitment, summaryWithoutCycle } from "@/__fixtures__/dashboard-summary";
import { mapSobresScreen, savingsLineFromOverview } from "@/shared/lib/dashboard/sobres-model";

type Summary = NonNullable<Parameters<typeof mapSobresScreen>[0]>;
type ActiveSummary = Extract<Summary, { cycle: { startDate: number } }>;

const AUGUST_START = Date.UTC(2026, 7, 1, 5, 0, 0);

function summary(
	overrides: {
		envelopes?: ActiveSummary["envelopes"];
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
		hero: {
			dailyAvailableCents: 0,
			displayDailyCents: 0,
			bodyCopy: undefined,
			validationCopy: undefined,
			statusBadge: "stable",
			spendableCents: 0,
			reservedCents: 0,
			unallocatedCents: 0,
		},
		liquidity: {
			spendableCents: 0,
			reservedCents: 0,
			unallocatedCents: 0,
			savingsParkedInEnvelopeCents: 0,
		},
		envelopes: overrides.envelopes ?? [
			{
				type: "needs" as const,
				allocatedAmount: 175_000,
				remainingAmount: 113_800,
				percentRemaining: 65,
			},
			{
				type: "wants" as const,
				allocatedAmount: 105_000,
				remainingAmount: 23_100,
				percentRemaining: 22,
			},
			{
				type: "savings" as const,
				allocatedAmount: 70_000,
				remainingAmount: 70_000,
				percentRemaining: 100,
			},
		],
		commitments: overrides.commitments ?? [
			commitment({
				id: "rent",
				name: "Alquiler",
				amount: 110_000,
				envelope: "needs",
				daysUntilDue: 1,
				paymentStatus: "pending",
			}),
			commitment({
				id: "paid",
				name: "Netflix",
				amount: 3_000,
				envelope: "wants",
				daysUntilDue: 2,
				paymentStatus: "paid",
			}),
		],
		coach: {
			kind: "tranquil",
			message: "",
			interactionId: undefined,
			options: undefined,
			crisisOptions: undefined,
			crisisPlan: undefined,
			rescueSuggestion: undefined,
			awaitingRescueConfirmation: false,
		},
		movements: [],
		isEarlyCycle: false,
		closedCycle: null,
	};
}

describe("mapSobresScreen", () => {
	it("devuelve null sin ciclo", () => {
		expect(mapSobresScreen(summaryWithoutCycle)).toBeNull();
		expect(mapSobresScreen(null)).toBeNull();
	});

	it("arma la barra y el ritmo del tratamiento 1h", () => {
		const screen = mapSobresScreen(summary(), "FONDO + VIAJE");
		expect(screen?.dayLabel).toBe("DÍA 15 / 30");
		expect(screen?.envelopes).toEqual([
			{
				tone: "needs",
				label: "Necesidades",
				statusLabel: "Al día",
				statusTone: "calm",
				symbol: "S/",
				negative: false,
				amountLabel: "1,138",
				budgetLabel: "de S/ 1,750",
				progress: 35,
				footLeft: "GASTADO S/ 612",
				footRight: "ALQUILER PENDIENTE",
				footRightTone: "calm",
			},
			{
				tone: "wants",
				label: "Gustos",
				statusLabel: "Va rápido",
				statusTone: "fast",
				symbol: "S/",
				negative: false,
				amountLabel: "231",
				budgetLabel: "de S/ 1,050",
				progress: 78,
				footLeft: "GASTADO S/ 819",
				footRight: "ALCANZA 6 DÍAS",
				footRightTone: "fast",
			},
			{
				tone: "savings",
				label: "Ahorro",
				statusLabel: "Intacto",
				statusTone: "calm",
				symbol: "S/",
				negative: false,
				amountLabel: "700",
				budgetLabel: "apartado este ciclo",
				progress: 100,
				footLeft: "FONDO + VIAJE",
				footRight: "100%",
				footRightTone: "calm",
			},
		]);
		expect(JSON.stringify(screen)).not.toContain("rent");
	});

	it("ordena los sobres aunque el resumen venga al revés", () => {
		const base = summary();
		const screen = mapSobresScreen(
			summary({
				envelopes: [...base.envelopes].reverse(),
			}),
		);
		expect(screen?.envelopes.map((envelope) => envelope.tone)).toEqual([
			"needs",
			"wants",
			"savings",
		]);
	});

	it("deja el pie quieto cuando el ritmo alcanza el ciclo y no hay compromiso", () => {
		const screen = mapSobresScreen(
			summary({
				commitments: [],
				envelopes: [
					{
						type: "wants",
						allocatedAmount: 105_000,
						remainingAmount: 90_000,
						percentRemaining: 86,
					},
				],
			}),
		);
		expect(screen?.envelopes[0]).toMatchObject({
			statusLabel: "Al día",
			footRight: null,
			progress: 14,
		});
	});

	it("prioriza el ritmo cuando el sobre no llega al cierre", () => {
		const screen = mapSobresScreen(
			summary({
				envelopes: [
					{
						type: "wants",
						allocatedAmount: 30_000,
						remainingAmount: 1_500,
						percentRemaining: 5,
					},
				],
				commitments: [
					commitment({
						id: "secret-id",
						name: "Cine",
						envelope: "wants",
						daysUntilDue: 3,
						paymentStatus: "pending",
					}),
				],
			}),
		);
		expect(screen?.envelopes[0]).toMatchObject({
			statusLabel: "Va rápido",
			footRight: "ALCANZA 1 DÍA",
			footRightTone: "fast",
		});
		expect(JSON.stringify(screen)).not.toContain("secret-id");
		expect(JSON.stringify(screen)).not.toContain("CINE");
	});

	it("marca el sobre en negativo y llena la barra", () => {
		const screen = mapSobresScreen(
			summary({
				envelopes: [
					{
						type: "needs",
						allocatedAmount: 1_000,
						remainingAmount: -500,
						percentRemaining: 0,
					},
				],
				commitments: [],
			}),
		);
		expect(screen?.envelopes[0]).toMatchObject({
			negative: true,
			amountLabel: "5",
			progress: 100,
			statusLabel: "Va rápido",
			footLeft: "GASTADO S/ 15",
			footRight: "ALCANZA 0 DÍAS",
		});
	});

	it("no llama intacto al ahorro que ya salió del sobre", () => {
		const screen = mapSobresScreen(
			summary({
				envelopes: [
					{
						type: "savings",
						allocatedAmount: 70_000,
						remainingAmount: 35_000,
						percentRemaining: 50,
					},
				],
			}),
			"FONDO",
		);
		expect(screen?.envelopes[0]).toMatchObject({
			statusLabel: null,
			amountLabel: "350",
			progress: 50,
			footLeft: "FONDO",
			footRight: "50%",
		});
	});
});

describe("savingsLineFromOverview", () => {
	it("une fondo y metas en mayúsculas, sin ids", () => {
		const line = savingsLineFromOverview({
			profile: { name: "Ana", currencyCode: "PEN" },
			hasActiveCycle: true,
			totalSavedCents: 0,
			cycleContributionCents: 0,
			emergencyFund: {
				id: fixtureId("subEnvelopes", "sub_secret"),
				label: " Fondo ",
				currentAmount: 0,
				targetAmount: 0,
				monthlyEssentialsCents: 0,
				monthsCovered: 0,
				monthsCoveredCopy: "",
				progressPercent: 0,
				cycleContributionCents: 0,
				cyclesToComplete: null,
				contributionStreak: 0,
				availableToContributeCents: 0,
			},
			goals: [
				{
					id: fixtureId("subEnvelopes", "goal_secret"),
					label: "Viaje",
					currentAmount: 0,
					targetAmount: 0,
					progressPercent: 0,
					isSystemDefault: false,
				},
				{
					id: fixtureId("subEnvelopes", "blank"),
					label: "   ",
					currentAmount: 0,
					targetAmount: 0,
					progressPercent: 0,
					isSystemDefault: false,
				},
			],
			canCreateGoal: false,
			assignPlan: null,
		});
		expect(line).toBe("FONDO + VIAJE");
		expect(line).not.toContain("secret");
	});

	it("devuelve null si aún no hay nombres", () => {
		expect(savingsLineFromOverview(undefined)).toBeNull();
		expect(savingsLineFromOverview(null)).toBeNull();
		expect(
			savingsLineFromOverview({
				profile: { name: "Ana", currencyCode: "PEN" },
				hasActiveCycle: false,
				totalSavedCents: 0,
				cycleContributionCents: 0,
				emergencyFund: null,
				goals: [],
				canCreateGoal: false,
				assignPlan: null,
			}),
		).toBeNull();
	});
});
