import { describe, expect, it } from "vitest";
import { assertAllocationBalances, assertNonNegativeCents } from "./moneyInvariant";

describe("moneyInvariant", () => {
	it("rejects non-integer cents", () => {
		expect(() => assertNonNegativeCents(10.5, "amount")).toThrow(/céntimos/);
	});

	it("rejects negative cents", () => {
		expect(() => assertNonNegativeCents(-1, "amount")).toThrow(/negativo/);
	});

	it("passes balanced allocation (no double count)", () => {
		expect(
			assertAllocationBalances(100_00, {
				reservedCents: 40_00,
				envelopesCents: 30_00,
				savingsContributionCents: 20_00,
				unallocatedCents: 10_00,
			}),
		).toEqual({ ok: true });
	});

	it("fails when destinations exceed income", () => {
		expect(
			assertAllocationBalances(100_00, {
				reservedCents: 60_00,
				envelopesCents: 50_00,
				savingsContributionCents: 0,
				unallocatedCents: 0,
			}).ok,
		).toBe(false);
	});

	it("fails when destinations under-assign without unallocated", () => {
		expect(
			assertAllocationBalances(100_00, {
				reservedCents: 40_00,
				envelopesCents: 30_00,
				savingsContributionCents: 0,
				unallocatedCents: 0,
			}).ok,
		).toBe(false);
	});
});
