import { describe, expect, it } from "vitest";
import {
	activeReservedCents,
	applyReleaseReservation,
	buildPaidSignalReservationPatches,
} from "./commitmentReservation";

/**
 * I1 — Pagado es solo señal: libera reservas, no inventa gasto ni debita sobres.
 */
describe("buildPaidSignalReservationPatches", () => {
	it("releases every active reservation without inventing envelope debit", () => {
		const patches = buildPaidSignalReservationPatches([
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
				consumedCents: 20_000,
				releasedCents: 0,
				status: "partially_consumed",
			},
			{
				id: "r3",
				reservedCents: 50_000,
				consumedCents: 50_000,
				releasedCents: 0,
				status: "consumed",
			},
		]);

		expect(patches).toEqual([
			{
				id: "r1",
				releasedCents: 200_000,
				status: "released",
				returnedCents: 200_000,
			},
			{
				id: "r2",
				releasedCents: 60_000,
				status: "released",
				returnedCents: 60_000,
			},
		]);
		expect(patches.every((p) => p.status === "released")).toBe(true);
	});

	it("returns empty patches when nothing is active", () => {
		expect(
			buildPaidSignalReservationPatches([
				{
					id: "done",
					reservedCents: 10,
					consumedCents: 10,
					releasedCents: 0,
					status: "consumed",
				},
			]),
		).toEqual([]);
	});

	it("matches applyReleaseReservation per row", () => {
		const row = {
			id: "r1",
			reservedCents: 100_000,
			consumedCents: 25_000,
			releasedCents: 0,
			status: "active" as const,
		};
		const [patch] = buildPaidSignalReservationPatches([row]);
		const released = applyReleaseReservation({ row });
		expect(patch?.releasedCents).toBe(released.releasedCents);
		expect(patch?.returnedCents).toBe(released.returnedToUnallocatedCents);
		expect(activeReservedCents({ ...row, ...released })).toBe(0);
	});
});
