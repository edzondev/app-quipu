import { describe, expect, it } from "vitest";
import { computeDistributableCents, suggestHeldCents, validateHeldCents } from "./incomeHold";

describe("computeDistributableCents", () => {
	it("returns amount - heldCents when held is in range", () => {
		expect(computeDistributableCents(350_000, 250_000)).toBe(100_000);
	});

	it("returns full amount when heldCents is 0", () => {
		expect(computeDistributableCents(350_000, 0)).toBe(350_000);
	});

	it("returns 0 when heldCents equals amount", () => {
		expect(computeDistributableCents(100_000, 100_000)).toBe(0);
	});

	it("clamps heldCents to amount (does not go negative)", () => {
		expect(computeDistributableCents(100_000, 200_000)).toBe(0);
	});

	it("clamps negative heldCents to 0", () => {
		expect(computeDistributableCents(100_000, -5_000)).toBe(100_000);
	});
});

describe("suggestHeldCents", () => {
	it("returns min(amount, uncovered)", () => {
		expect(suggestHeldCents(350_000, 250_000)).toBe(250_000);
	});

	it("is capped at amount when uncovered exceeds amount", () => {
		expect(suggestHeldCents(100_000, 500_000)).toBe(100_000);
	});

	it("returns 0 when there are no uncovered commitments", () => {
		expect(suggestHeldCents(350_000, 0)).toBe(0);
	});

	it("returns 0 when uncovered is negative (should not happen, but guard)", () => {
		expect(suggestHeldCents(350_000, -1_000)).toBe(0);
	});

	it("floors fractional uncovered remainders", () => {
		expect(suggestHeldCents(100_000, 50_000.9)).toBe(50_000);
	});
});

describe("validateHeldCents", () => {
	it("returns null for valid hold (0)", () => {
		expect(validateHeldCents(100_000, 0)).toBeNull();
	});

	it("returns null for valid hold less than amount", () => {
		expect(validateHeldCents(350_000, 250_000)).toBeNull();
	});

	it("returns null for hold equal to amount", () => {
		expect(validateHeldCents(100_000, 100_000)).toBeNull();
	});

	it("returns error when heldCents exceeds amount", () => {
		expect(validateHeldCents(100_000, 150_000)).not.toBeNull();
	});

	it("returns error when heldCents is negative", () => {
		expect(validateHeldCents(100_000, -1)).not.toBeNull();
	});

	it("returns error when heldCents is not integer", () => {
		expect(validateHeldCents(100_000, 50_000.5)).not.toBeNull();
	});
});
