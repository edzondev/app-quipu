import {
	emptyCommitments,
	presentCommitments,
	toCreateCommitment,
} from "@/shared/lib/commitments/model";

const AUG_16 = Date.UTC(2026, 7, 16, 17, 0, 0);
const AUG_22 = Date.UTC(2026, 7, 22, 17, 0, 0);
const AUG_6 = Date.UTC(2026, 7, 6, 17, 0, 0);
const AUG_3 = Date.UTC(2026, 7, 3, 17, 0, 0);

function row(
	overrides: Partial<{
		id: string;
		name: string;
		amount: number;
		dueDay: number;
		nextDueAt: number;
		daysUntilDue: number;
		coverageStatus: "covered" | "partial" | "uncovered";
		paymentStatus: "paid" | "pending" | "overdue";
		paidAtForCycle: number | undefined;
	}> = {},
) {
	return {
		id: "c1",
		name: "Alquiler",
		amount: 110_000,
		envelope: "needs" as const,
		dueDay: 16,
		nextDueAt: AUG_16,
		daysUntilDue: 1,
		coverageStatus: "covered" as const,
		paymentStatus: "pending" as const,
		paidAtForCycle: undefined,
		...overrides,
	};
}

function coverage(
	commitments: ReturnType<typeof row>[],
	totalCents = commitments.reduce((sum, item) => sum + item.amount, 0),
) {
	return {
		currencyCode: "PEN",
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
		expect(
			toCreateCommitment({
				name: "Cine",
				amountRaw: "40",
				dueDay: "32",
				envelope: "wants",
			}).ok,
		).toBe(false);
	});
});
