import { describe, expect, it } from "vitest";
import { limaDatePartsToTimestamp, limaStartOfDay } from "@/shared/lib/date";
import { formatIncomeDateLabel } from "../incomeForm";

describe("formatIncomeDateLabel", () => {
	it("prefija Hoy cuando la fecha coincide con hoy en Lima", () => {
		const now = Date.parse("2026-07-21T15:00:00-05:00");
		const occurredAt = limaStartOfDay(now);
		expect(formatIncomeDateLabel(occurredAt, now)).toMatch(/^Hoy · /);
	});

	it("prefija Ayer para el día anterior en Lima", () => {
		const now = Date.parse("2026-07-21T15:00:00-05:00");
		const yesterday = limaDatePartsToTimestamp({
			year: 2026,
			month: 7,
			day: 20,
		});
		expect(formatIncomeDateLabel(yesterday, now)).toMatch(/^Ayer · /);
	});

	it("muestra año cuando el ingreso es de otro año", () => {
		const now = Date.parse("2026-07-21T15:00:00-05:00");
		const lastYear = limaDatePartsToTimestamp({
			year: 2025,
			month: 12,
			day: 10,
		});
		expect(formatIncomeDateLabel(lastYear, now)).toContain("2025");
	});
});
