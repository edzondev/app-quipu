import { describe, expect, it } from "vitest";
import { formatCycle } from "../modules/onboarding/lib/cycle";

describe("formatCycle", () => {
	it("monthly returns day and month in Spanish", () => {
		const result = formatCycle([15], "monthly");
		expect(result.kind).toBe("range");
		if (result.kind === "range") {
			expect(result.start).toMatch(/15 [a-z]+/);
			expect(result.end).toMatch(/15 [a-z]+/);
		}
	});

	it("monthly crosses month boundary with same day", () => {
		const result = formatCycle([1], "monthly");
		expect(result.kind).toBe("range");
		if (result.kind === "range") {
			expect(result.start).toMatch(/1 [a-z]+/);
			expect(result.end).toMatch(/1 [a-z]+/);
		}
	});

	it("biweekly returns both days joined with y, sorted", () => {
		const result = formatCycle([1, 15], "biweekly");
		expect(result).toMatchObject({
			kind: "text",
			value: expect.stringMatching(/^1 y 15 (ene|feb|mar|abr|may|jun|jul|ago|sep|oct|nov|dic)$/),
		});
	});

	it("biweekly sorts days ascending", () => {
		const result = formatCycle([30, 15], "biweekly");
		expect(result).toMatchObject({
			kind: "text",
			value: expect.stringMatching(/^15 y 30 (ene|feb|mar|abr|may|jun|jul|ago|sep|oct|nov|dic)$/),
		});
	});

	it("biweekly with only one payday falls back to monthly", () => {
		const result = formatCycle([15], "biweekly");
		expect(result.kind).toBe("range");
		if (result.kind === "range") {
			expect(result.start).toMatch(/15 [a-z]+/);
			expect(result.end).toMatch(/15 [a-z]+/);
		}
	});

	it("monthly and biweekly use short month names", () => {
		expect(formatCycle([1], "monthly").kind).toBe("range");
		expect(formatCycle([1], "monthly")).toMatchObject({
			kind: "range",
			start: expect.stringMatching(/ene|feb|mar|abr|may|jun|jul|ago|sep|oct|nov|dic/),
		});
		expect(formatCycle([1, 15], "biweekly")).toMatchObject({
			kind: "text",
			value: expect.stringMatching(/ene|feb|mar|abr|may|jun|jul|ago|sep|oct|nov|dic/),
		});
	});
});
