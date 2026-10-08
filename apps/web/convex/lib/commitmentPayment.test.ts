import { describe, expect, it } from "vitest";
import { isCommitmentPaidForCycle, resolveCommitmentPaymentStatus } from "./commitmentPayment";

const CYCLE_A = "cycle_a" as never;
const CYCLE_B = "cycle_b" as never;

const FEB_6 = new Date("2026-02-06T05:00:00.000Z").getTime();
const JAN_20_NOON = new Date("2026-01-20T17:00:00.000Z").getTime();
const FEB_7_NOON = new Date("2026-02-07T17:00:00.000Z").getTime();

describe("isCommitmentPaidForCycle", () => {
	it("returns true when paidForCycleId matches active cycle", () => {
		expect(isCommitmentPaidForCycle({ paidAt: 1, paidForCycleId: CYCLE_A }, CYCLE_A)).toBe(true);
	});

	it("returns false when paid in a previous cycle", () => {
		expect(isCommitmentPaidForCycle({ paidAt: 1, paidForCycleId: CYCLE_A }, CYCLE_B)).toBe(false);
	});
});

describe("resolveCommitmentPaymentStatus", () => {
	it("returns paid when marked for the active cycle", () => {
		expect(
			resolveCommitmentPaymentStatus({
				paidAt: JAN_20_NOON,
				paidForCycleId: CYCLE_A,
				activeCycleId: CYCLE_A,
				nextDueAt: FEB_6,
				now: JAN_20_NOON,
			}),
		).toBe("paid");
	});

	it("returns pending before next due when not paid", () => {
		expect(
			resolveCommitmentPaymentStatus({
				activeCycleId: CYCLE_A,
				nextDueAt: FEB_6,
				now: JAN_20_NOON,
			}),
		).toBe("pending");
	});

	it("returns pending on the due date", () => {
		expect(
			resolveCommitmentPaymentStatus({
				activeCycleId: CYCLE_A,
				nextDueAt: FEB_6,
				now: FEB_6,
			}),
		).toBe("pending");
	});

	it("returns overdue after next due when not paid", () => {
		expect(
			resolveCommitmentPaymentStatus({
				activeCycleId: CYCLE_A,
				nextDueAt: FEB_6,
				now: FEB_7_NOON,
			}),
		).toBe("overdue");
	});

	it("does not mark newly created commitments overdue before first due", () => {
		expect(
			resolveCommitmentPaymentStatus({
				activeCycleId: CYCLE_A,
				nextDueAt: FEB_6,
				now: JAN_20_NOON,
			}),
		).toBe("pending");
	});

	it("returns paid even when next due passed", () => {
		expect(
			resolveCommitmentPaymentStatus({
				paidAt: FEB_7_NOON,
				paidForCycleId: CYCLE_A,
				activeCycleId: CYCLE_A,
				nextDueAt: FEB_6,
				now: FEB_7_NOON,
			}),
		).toBe("paid");
	});

	it("returns pending without active cycle even if due passed", () => {
		expect(
			resolveCommitmentPaymentStatus({
				activeCycleId: null,
				nextDueAt: FEB_6,
				now: FEB_7_NOON,
			}),
		).toBe("pending");
	});
});
