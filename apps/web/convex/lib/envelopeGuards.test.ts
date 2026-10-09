import { describe, expect, it } from "vitest";
import {
	allowsOutboundTransfer,
	canReverseDistributionApplied,
	canReverseEnvelopeAllocation,
	isEnvelopeFrozen,
} from "./envelopeGuards";

describe("isEnvelopeFrozen", () => {
	it("is false when frozenUntil is undefined", () => {
		expect(isEnvelopeFrozen(undefined, 1_000)).toBe(false);
	});

	it("is true while now is before frozenUntil", () => {
		expect(isEnvelopeFrozen(2_000, 1_000)).toBe(true);
	});

	it("is false once freeze expires", () => {
		expect(isEnvelopeFrozen(2_000, 2_000)).toBe(false);
		expect(isEnvelopeFrozen(2_000, 2_001)).toBe(false);
	});
});

describe("allowsOutboundTransfer", () => {
	it("blocks outbound while frozen", () => {
		expect(allowsOutboundTransfer(5_000, 1_000)).toBe(false);
	});

	it("allows outbound when not frozen", () => {
		expect(allowsOutboundTransfer(undefined, 1_000)).toBe(true);
		expect(allowsOutboundTransfer(1_000, 1_000)).toBe(true);
	});
});

describe("canReverseEnvelopeAllocation", () => {
	it("allows zero reverse", () => {
		expect(canReverseEnvelopeAllocation({ remainingAmount: 0, reverseCents: 0 })).toBe(true);
	});

	it("rejects when remaining is below reverse amount", () => {
		expect(
			canReverseEnvelopeAllocation({
				remainingAmount: 99,
				reverseCents: 100,
			}),
		).toBe(false);
	});

	it("allows exact remaining", () => {
		expect(
			canReverseEnvelopeAllocation({
				remainingAmount: 100,
				reverseCents: 100,
			}),
		).toBe(true);
	});
});

describe("canReverseDistributionApplied", () => {
	it("fails closed when any envelope was already spent below the reverse", () => {
		expect(
			canReverseDistributionApplied(
				[
					{ type: "needs", remainingAmount: 50_000 },
					{ type: "wants", remainingAmount: 30_000 },
					{ type: "savings", remainingAmount: 20_000 },
				],
				{ needs: 100_000, wants: 0, savings: 0 },
			),
		).toBe(false);
	});

	it("allows reverse when all envelopes still hold the allocated remaining", () => {
		expect(
			canReverseDistributionApplied(
				[
					{ type: "needs", remainingAmount: 100_000 },
					{ type: "wants", remainingAmount: 60_000 },
					{ type: "savings", remainingAmount: 40_000 },
				],
				{ needs: 100_000, wants: 60_000, savings: 40_000 },
			),
		).toBe(true);
	});

	it("does not let a negative carryover block reversing this cycle's income", () => {
		expect(
			canReverseDistributionApplied(
				[
					{ type: "needs", remainingAmount: 5_000, carriedOverCents: -5_000 },
					{ type: "wants", remainingAmount: 6_000, carriedOverCents: 0 },
					{ type: "savings", remainingAmount: 4_000 },
				],
				{ needs: 10_000, wants: 6_000, savings: 4_000 },
			),
		).toBe(true);
	});
});
