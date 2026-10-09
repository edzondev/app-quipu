import { extraKind, sueldoKind } from "@/__fixtures__/income-kind";
import { toCreateIncomeEventArgs } from "@/shared/lib/income/draft";
import { assertCreateIncomeEventArgs } from "@/test-support/assert-create-income-event-args";

const OCCURRED_AT = Date.parse("2026-10-09T05:00:00.000Z");

describe("toCreateIncomeEventArgs", () => {
	it("Empieza un nuevo ciclo manda el payload habitual completo", () => {
		const args = toCreateIncomeEventArgs({
			amountCents: 350000,
			occurredAt: OCCURRED_AT,
			incomeKind: sueldoKind,
		});
		assertCreateIncomeEventArgs(args);
		expect(args).toEqual({
			amount: 350000,
			source: "payroll",
			description: "Sueldo",
			occurredAt: OCCURRED_AT,
			incomeKind: "habitual",
		});
	});

	it("Sumar al ciclo actual manda extraordinaryType, etiqueta y distributionPolicy", () => {
		const args = toCreateIncomeEventArgs({
			amountCents: 50000,
			occurredAt: OCCURRED_AT,
			incomeKind: extraKind,
		});
		assertCreateIncomeEventArgs(args);
		expect(args).toEqual({
			amount: 50000,
			source: "payroll",
			description: "Sueldo",
			occurredAt: OCCURRED_AT,
			incomeKind: "extraordinary",
			extraordinaryType: "custom",
			extraordinaryLabel: "Extra",
			distributionPolicy: "profile_default",
		});
	});

	it("rechaza un extra al que le falta extraordinaryType o distributionPolicy", () => {
		expect(() =>
			assertCreateIncomeEventArgs({
				amount: 50000,
				source: "payroll",
				description: "Sueldo",
				occurredAt: OCCURRED_AT,
				incomeKind: "extraordinary",
			}),
		).toThrow(/extraordinaryType/);
		expect(() =>
			assertCreateIncomeEventArgs({
				amount: 50000,
				source: "payroll",
				description: "Sueldo",
				occurredAt: OCCURRED_AT,
				incomeKind: "extraordinary",
				extraordinaryType: "custom",
				extraordinaryLabel: "Extra",
			}),
		).toThrow(/distributionPolicy/);
	});
});
