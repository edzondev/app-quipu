import { describe, expect, it } from "vitest";
import {
	activeReservedCents,
	applyPayFromReservations,
	applyReleaseReservation,
	resolveReservationDisplayStatus,
	sumActiveReservedCents,
} from "./commitmentReservation";

describe("commitmentReservation", () => {
	it("computes active reserved cents", () => {
		expect(
			activeReservedCents({
				reservedCents: 100_00,
				consumedCents: 20_00,
				releasedCents: 10_00,
				status: "partially_consumed",
			}),
		).toBe(70_00);
	});

	it("resolveReservationDisplayStatus covers partial and full", () => {
		expect(
			resolveReservationDisplayStatus({
				commitmentAmountCents: 250_000,
				activeReservedCents: 0,
				isPaid: false,
			}),
		).toBe("pending");
		expect(
			resolveReservationDisplayStatus({
				commitmentAmountCents: 250_000,
				activeReservedCents: 100_000,
				isPaid: false,
			}),
		).toBe("partially_reserved");
		expect(
			resolveReservationDisplayStatus({
				commitmentAmountCents: 250_000,
				activeReservedCents: 250_000,
				isPaid: false,
			}),
		).toBe("fully_reserved");
		expect(
			resolveReservationDisplayStatus({
				commitmentAmountCents: 250_000,
				activeReservedCents: 250_000,
				isPaid: true,
			}),
		).toBe("paid");
	});

	it("pay uses reserve first and avoids double count", () => {
		const result = applyPayFromReservations({
			dueCents: 250_000,
			reservations: [
				{
					id: "r1",
					reservedCents: 200_000,
					consumedCents: 0,
					releasedCents: 0,
					status: "active",
				},
				{
					id: "r2",
					reservedCents: 80_000,
					consumedCents: 0,
					releasedCents: 0,
					status: "active",
				},
			],
		});
		expect(result.fromReserveCents).toBe(250_000);
		expect(result.remainderCents).toBe(0);
		expect(result.reservationPatches).toEqual([
			{ id: "r1", consumedCents: 200_000, status: "consumed" },
			{ id: "r2", consumedCents: 50_000, status: "partially_consumed" },
		]);
	});

	it("cancel releases leftover to unallocated", () => {
		const result = applyReleaseReservation({
			row: {
				reservedCents: 100_00,
				consumedCents: 20_00,
				releasedCents: 0,
				status: "partially_consumed",
			},
		});
		expect(result.returnedToUnallocatedCents).toBe(80_00);
		expect(result.status).toBe("released");
	});

	it("sumActiveReservedCents ignores consumed/released rows", () => {
		expect(
			sumActiveReservedCents([
				{
					reservedCents: 50,
					consumedCents: 0,
					releasedCents: 0,
					status: "active",
				},
				{
					reservedCents: 50,
					consumedCents: 50,
					releasedCents: 0,
					status: "consumed",
				},
			]),
		).toBe(50);
	});
});
