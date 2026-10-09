import { ConvexError } from "convex/values";
import { describe, expect, it } from "vitest";
import { assertNextPayDate, NEXT_PAY_DATE_MESSAGE } from "./firstCycleDates";

/** 9 oct 2026, 15:30 en Lima (UTC-5, sin DST). */
const NOW = Date.parse("2026-10-09T15:30:00-05:00");

function endMs(day: string): number {
	return Date.parse(`${day}T00:00:00-05:00`);
}

function payDateError(nextPayDate: string, now = NOW): unknown {
	try {
		assertNextPayDate(nextPayDate, now);
		return null;
	} catch (error) {
		if (!(error instanceof ConvexError)) throw error;
		return error.data;
	}
}

describe("assertNextPayDate", () => {
	it("accepts tomorrow through today + 31 Lima days and returns Lima midnight", () => {
		expect(assertNextPayDate("2026-10-10", NOW)).toBe(endMs("2026-10-10"));
		expect(assertNextPayDate("2026-11-09", NOW)).toBe(endMs("2026-11-09"));
	});

	it("rejects today and today + 32 days", () => {
		expect(payDateError("2026-10-09")).toMatchObject({
			code: "VALIDATION_ERROR",
			message: NEXT_PAY_DATE_MESSAGE,
			data: { field: "nextPayDate" },
		});
		expect(payDateError("2026-11-10")).toMatchObject({
			code: "VALIDATION_ERROR",
			message: NEXT_PAY_DATE_MESSAGE,
			data: { field: "nextPayDate" },
		});
	});

	it("uses the Lima calendar day when UTC has already rolled over", () => {
		const lateLima = Date.parse("2026-10-10T03:30:00Z");
		expect(assertNextPayDate("2026-10-10", lateLima)).toBe(endMs("2026-10-10"));
		expect(payDateError("2026-10-09", lateLima)).toMatchObject({
			code: "VALIDATION_ERROR",
			data: { field: "nextPayDate" },
		});
	});

	it("rejects malformed and impossible calendar days", () => {
		for (const nextPayDate of [
			"",
			"2026-10-9",
			"2026/10/10",
			"hoy",
			"2026-02-31",
			"2026-10-10T00:00:00-05:00",
		]) {
			expect(payDateError(nextPayDate)).toMatchObject({
				code: "VALIDATION_ERROR",
				message: NEXT_PAY_DATE_MESSAGE,
				data: { field: "nextPayDate" },
			});
		}
	});
});
