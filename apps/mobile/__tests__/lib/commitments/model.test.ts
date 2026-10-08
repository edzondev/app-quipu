import { fixtureId } from "@/__fixtures__/convex-id";
import {
	type CommitmentCoverage,
	type CoverageRow,
	dueDayHint,
	emptyCommitments,
	parseDueDay,
	presentCommitments,
	toCreateCommitment,
} from "@/shared/lib/commitments/model";

const AUG_16 = Date.UTC(2026, 7, 16, 17, 0, 0);
const AUG_22 = Date.UTC(2026, 7, 22, 17, 0, 0);
const AUG_6 = Date.UTC(2026, 7, 6, 17, 0, 0);
const AUG_3 = Date.UTC(2026, 7, 3, 17, 0, 0);

function row(overrides: Omit<Partial<CoverageRow>, "id"> & { id?: string } = {}): CoverageRow {
	const { id = "c1", ...rest } = overrides;
	return {
		id: fixtureId("fixedCommitments", id),
		name: "Alquiler",
		amount: 110_000,
		envelope: "needs",
		dueDay: 16,
		nextDueAt: AUG_16,
		daysUntilDue: 1,
		covered: 0,
		remaining: 110_000,
		progressPercent: 0,
		coverageStatus: "covered",
		cascadeStatus: "not-started",
		fundingEvents: [],
		coveredAt: undefined,
		paymentStatus: "pending",
		paidAtForCycle: undefined,
		...rest,
	};
}

function coverage(
	commitments: CoverageRow[],
	totalCents = commitments.reduce((sum, item) => sum + item.amount, 0),
): NonNullable<CommitmentCoverage> {
	return {
		currencyCode: "PEN",
		cycle: { startDate: AUG_16, endDate: AUG_16 },
		cycleId: fixtureId("financialCycles", "cycle"),
		totalCents,
		commitments,
	};
}

describe("presentCommitments", () => {
	it("suma pagado y pendiente por paymentStatus y arma la barra", () => {
		const screen = presentCommitments(
			coverage([
				row({
					id: "rent-secret",
					name: "Alquiler",
					amount: 110_000,
					daysUntilDue: 1,
					nextDueAt: AUG_16,
					coverageStatus: "covered",
					paymentStatus: "pending",
				}),
				row({
					id: "phone-secret",
					name: "Celular Entel",
					amount: 5_900,
					daysUntilDue: 20,
					nextDueAt: AUG_6,
					paymentStatus: "paid",
					paidAtForCycle: AUG_6,
					coverageStatus: "covered",
				}),
				row({
					id: "gym-secret",
					name: "Gimnasio",
					amount: 10_600,
					daysUntilDue: 28,
					paymentStatus: "paid",
					paidAtForCycle: AUG_3,
				}),
			]),
		);

		expect(screen.totalLabel).toBe("S/ 1,265");
		expect(screen.paidLabel).toBe("PAGADO S/ 165");
		expect(screen.pendingLabel).toBe("PENDIENTE S/ 1,100");
		expect(screen.paidPercent).toBe(13);
		expect(screen.rows.map((item) => item.name)).toEqual(["Alquiler", "Celular Entel", "Gimnasio"]);
		expect(screen.rows[0]).toMatchObject({
			meta: "VENCE MAÑANA · 16 AGO",
			metaTone: "soon",
			amountLabel: "S/ 1,100",
			amountMuted: false,
			statusLabel: "Cubierto",
			statusTone: "calm",
		});
		expect(screen.rows[1]).toMatchObject({
			meta: "PAGADO 6 AGO",
			metaTone: "muted",
			amountMuted: true,
			statusLabel: "Pagado",
			statusTone: "muted",
		});
		const visible = screen.rows
			.map((item) => `${item.name} ${item.meta} ${item.amountLabel} ${item.statusLabel}`)
			.join(" ");
		expect(visible).not.toContain("secret");
	});

	it("traduce parcial, sin cubrir, vencido y el ritmo mensual", () => {
		const screen = presentCommitments(
			coverage([
				row({
					id: "light",
					name: "Luz del Sur",
					amount: 9_600,
					daysUntilDue: 7,
					nextDueAt: AUG_22,
					coverageStatus: "partial",
					paymentStatus: "pending",
				}),
				row({
					id: "net",
					name: "Internet",
					amount: 6_900,
					daysUntilDue: 0,
					coverageStatus: "uncovered",
					paymentStatus: "pending",
				}),
				row({
					id: "late",
					name: "Agua",
					amount: 4_500,
					daysUntilDue: -2,
					coverageStatus: "uncovered",
					paymentStatus: "overdue",
				}),
			]),
		);
		expect(screen.rows.map((item) => item.statusLabel)).toEqual([
			"Vencido",
			"Sin cubrir",
			"Parcial",
		]);
		expect(screen.rows[1]?.meta).toBe("VENCE HOY · 16 AGO");
		expect(screen.rows[2]).toMatchObject({
			statusLabel: "Parcial",
			meta: "22 AGO · MENSUAL",
			metaTone: "muted",
		});
		expect(screen.rows[0]?.meta).toMatch(/^VENCIDO · /);
	});

	it("deja el ciclo vacío en cero", () => {
		expect(emptyCommitments()).toMatchObject({
			totalLabel: "S/ 0",
			paidPercent: 0,
			rows: [],
		});
		expect(presentCommitments(coverage([])).rows).toEqual([]);
	});
});

describe("toCreateCommitment", () => {
	it("arma la mutación con céntimos y sin ahorro", () => {
		expect(
			toCreateCommitment({
				name: " Alquiler ",
				amountRaw: "1,100.00",
				dueDay: "5",
				envelope: "needs",
			}),
		).toEqual({
			ok: true,
			args: { name: "Alquiler", amount: 110_000, dueDay: 5, envelope: "needs" },
		});
		const invalidAmount = toCreateCommitment({
			name: "Cine",
			amountRaw: "",
			dueDay: "5",
			envelope: "wants",
		});
		expect(invalidAmount.ok).toBe(false);
		if (!invalidAmount.ok) {
			expect(invalidAmount.fields.amountRaw).toBe("El monto debe ser mayor a cero.");
		}
	});

	it("rechaza un día fuera del 1 al 31", () => {
		const result = toCreateCommitment({
			name: "Luz",
			amountRaw: "10",
			dueDay: "64",
			envelope: "needs",
		});
		expect(result).toEqual({
			ok: false,
			fields: { dueDay: "El día de vencimiento va del 1 al 31." },
		});
	});
});

describe("parseDueDay", () => {
	it("acepta del 1 al 31 y rechaza el resto", () => {
		expect(parseDueDay("1")).toBe(1);
		expect(parseDueDay(" 31 ")).toBe(31);
		expect(parseDueDay("05")).toBe(5);
		for (const raw of ["", "0", "32", "64", "2a", "1.5"]) {
			expect(parseDueDay(raw)).toBeNull();
		}
	});
});

describe("dueDayHint", () => {
	const at = (day: string) => Date.parse(`${day}T12:00:00-05:00`);
	const SHORT = " En meses cortos vence el último día.";

	it("anuncia este mes si el día no pasó y el siguiente si ya pasó", () => {
		expect(dueDayHint("21", at("2026-10-07"))).toBe("Se repite cada mes. Próximo: 21 OCT.");
		expect(dueDayHint("5", at("2026-10-07"))).toBe("Se repite cada mes. Próximo: 5 NOV.");
		expect(dueDayHint("5", at("2026-12-30"))).toBe("Se repite cada mes. Próximo: 5 ENE.");
	});

	it("lleva los días 29 a 31 al último día de los meses cortos", () => {
		expect(dueDayHint("31", at("2026-02-10"))).toBe(`Se repite cada mes. Próximo: 28 FEB.${SHORT}`);
		expect(dueDayHint("31", at("2028-02-10"))).toBe(`Se repite cada mes. Próximo: 29 FEB.${SHORT}`);
		expect(dueDayHint("31", at("2026-04-10"))).toBe(`Se repite cada mes. Próximo: 30 ABR.${SHORT}`);
		expect(dueDayHint("30", at("2026-01-31"))).toBe(`Se repite cada mes. Próximo: 28 FEB.${SHORT}`);
		expect(dueDayHint("31", at("2026-03-10"))).toBe(`Se repite cada mes. Próximo: 31 MAR.${SHORT}`);
	});

	it("no promete fecha mientras el día no sea válido", () => {
		expect(dueDayHint("", at("2026-10-07"))).toBe("Se repite cada mes.");
		expect(dueDayHint("64", at("2026-10-07"))).toBe("Se repite cada mes.");
	});
});
