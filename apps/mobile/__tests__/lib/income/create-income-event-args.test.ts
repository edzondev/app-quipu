import { extraKind, sueldoKind } from "@/__fixtures__/income-kind";
import { toCreateIncomeEventArgs } from "@/shared/lib/income/draft";
import { EXTRA_COPY, type ExtraordinaryType, extraTypesFor } from "@/shared/lib/income/extra-types";
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

	it("un extra genérico manda extraordinaryType custom con su etiqueta y distributionPolicy", () => {
		const args = toCreateIncomeEventArgs({
			amountCents: 50000,
			occurredAt: OCCURRED_AT,
			incomeKind: extraKind,
			extraordinaryType: "custom",
		});
		assertCreateIncomeEventArgs(args);
		expect(args).toEqual({
			amount: 50000,
			source: "other",
			description: "Extra",
			occurredAt: OCCURRED_AT,
			incomeKind: "extraordinary",
			extraordinaryType: "custom",
			extraordinaryLabel: "Extra",
			distributionPolicy: "profile_default",
		});
	});

	it("una gratificación manda su tipo y no lleva etiqueta (el servidor la rechaza fuera de custom)", () => {
		const args = toCreateIncomeEventArgs({
			amountCents: 350000,
			occurredAt: OCCURRED_AT,
			incomeKind: extraKind,
			extraordinaryType: "gratification_july",
		});
		assertCreateIncomeEventArgs(args);
		expect(args).toEqual({
			amount: 350000,
			source: "payroll",
			description: "Gratificación de julio",
			occurredAt: OCCURRED_AT,
			incomeKind: "extraordinary",
			extraordinaryType: "gratification_july",
			distributionPolicy: "profile_default",
		});
		expect(args).not.toHaveProperty("extraordinaryLabel");
	});

	it("cada tipo ofrecido produce args que el servidor aceptaría", () => {
		for (const type of extraTypesFor("fixed")) {
			const args = toCreateIncomeEventArgs({
				amountCents: 1000,
				occurredAt: OCCURRED_AT,
				incomeKind: extraKind,
				extraordinaryType: type,
			});
			assertCreateIncomeEventArgs(args);
			expect(args).toMatchObject({ extraordinaryType: type });
			expect("extraordinaryLabel" in args).toBe(type === "custom");
		}
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

	it("el servidor rechaza etiqueta fuera de custom: el assert también", () => {
		expect(() =>
			assertCreateIncomeEventArgs({
				amount: 50000,
				source: "payroll",
				description: "CTS",
				occurredAt: OCCURRED_AT,
				incomeKind: "extraordinary",
				extraordinaryType: "cts",
				extraordinaryLabel: "Extra",
				distributionPolicy: "profile_default",
			}),
		).toThrow(/extraordinaryLabel/);
	});
});

describe("extraTypesFor", () => {
	it("un dependiente ve gratificaciones, CTS, bono, utilidades y Otro", () => {
		expect(extraTypesFor("fixed")).toEqual([
			"gratification_july",
			"gratification_december",
			"cts",
			"corporate_bonus",
			"profit_sharing",
			"custom",
		]);
	});

	it("un independiente, un mixto o sin perfil solo tienen «Extra»", () => {
		expect(extraTypesFor("variable")).toEqual(["custom"]);
		expect(extraTypesFor("mixed")).toEqual(["custom"]);
		expect(extraTypesFor(null)).toEqual(["custom"]);
		expect(extraTypesFor(undefined)).toEqual(["custom"]);
	});

	it("todo tipo ofrecido tiene texto para el chip y para el botón", () => {
		const offered: readonly ExtraordinaryType[] = extraTypesFor("fixed");
		for (const type of offered) {
			expect(EXTRA_COPY[type].chip.length).toBeGreaterThan(0);
			expect(EXTRA_COPY[type].submit).toMatch(/^Registrar /);
		}
	});
});
