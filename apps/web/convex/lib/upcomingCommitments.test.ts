import { describe, expect, it } from "vitest";
import { filterUpcomingCommitments, type UpcomingCommitmentSlice } from "./upcomingCommitments";

const now = new Date("2026-07-28T12:00:00-05:00").getTime();

function commitment(
	overrides: Partial<UpcomingCommitmentSlice> & Pick<UpcomingCommitmentSlice, "id">,
): UpcomingCommitmentSlice {
	return {
		name: "Compromiso",
		amount: 10_000,
		remaining: 10_000,
		dueDay: 28,
		nextDueAt: now,
		daysUntilDue: 0,
		cascadeStatus: "not-started",
		...overrides,
	};
}

describe("filterUpcomingCommitments", () => {
	it("returns empty list when nothing is upcoming", () => {
		expect(filterUpcomingCommitments([], now)).toEqual([]);
	});

	it("includes a commitment due in one day when partially covered", () => {
		const tomorrow = new Date("2026-07-29T12:00:00-05:00").getTime();
		const result = filterUpcomingCommitments(
			[
				commitment({
					id: "rent",
					name: "Alquiler",
					nextDueAt: tomorrow,
					daysUntilDue: 1,
					cascadeStatus: "partial",
					remaining: 5_000,
				}),
			],
			now,
		);

		expect(result).toHaveLength(1);
		expect(result[0]?.name).toBe("Alquiler");
	});

	it("excludes commitments due in five days", () => {
		const inFiveDays = new Date("2026-08-02T12:00:00-05:00").getTime();
		expect(
			filterUpcomingCommitments(
				[
					commitment({
						id: "rent",
						nextDueAt: inFiveDays,
						daysUntilDue: 5,
						cascadeStatus: "not-started",
					}),
				],
				now,
			),
		).toEqual([]);
	});

	it("excludes fully covered commitments", () => {
		expect(
			filterUpcomingCommitments(
				[
					commitment({
						id: "rent",
						cascadeStatus: "covered",
						remaining: 0,
					}),
				],
				now,
			),
		).toEqual([]);
	});

	it("includes partially covered commitments within the window", () => {
		const result = filterUpcomingCommitments(
			[
				commitment({
					id: "netflix",
					name: "Netflix",
					cascadeStatus: "partial",
					remaining: 2_400,
					daysUntilDue: 2,
				}),
			],
			now,
		);

		expect(result).toHaveLength(1);
		expect(result[0]?.cascadeStatus).toBe("partial");
	});
});
