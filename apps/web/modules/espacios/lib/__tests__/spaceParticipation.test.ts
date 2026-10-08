import { describe, expect, it } from "vitest";
import { participationPercent } from "../spaceParticipation";

describe("participationPercent", () => {
	it("caps at 100 when contributed exceeds expected", () => {
		expect(participationPercent(150_00, 100_00)).toBe(100);
	});

	it("returns 0 when nothing expected and nothing contributed", () => {
		expect(participationPercent(0, 0)).toBe(0);
	});
});
