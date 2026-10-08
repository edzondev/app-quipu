import { describe, expect, it } from "vitest";
import {
	buildCoverFromSavingsOption,
	buildPostponeOption,
	type CrisisCommitmentSlice,
	computeCoverFromSavingsSplit,
	pickPostponeCandidate,
} from "./crisisResolution";

describe("pickPostponeCandidate", () => {
	const commitments: CrisisCommitmentSlice[] = [
		{
			id: "rent",
			name: "Alquiler",
			amount: 120_000,
			remaining: 120_000,
			envelope: "needs",
			dueDay: 5,
		},
		{
			id: "spotify",
			name: "Spotify",
			amount: 2_400,
			remaining: 2_400,
			envelope: "wants",
			dueDay: 18,
		},
		{
			id: "netflix",
			name: "Netflix",
			amount: 4_500,
			remaining: 4_500,
			envelope: "wants",
			dueDay: 20,
		},
	];

	it("prefers the smallest wants commitment with remaining balance", () => {
		expect(pickPostponeCandidate(commitments)?.id).toBe("spotify");
	});

	it("falls back to needs when no wants commitments remain uncovered", () => {
		expect(
			pickPostponeCandidate([
				commitments[0]!,
				{ ...commitments[1]!, remaining: 0 },
				{ ...commitments[2]!, remaining: 0 },
			])?.id,
		).toBe("rent");
	});

	it("returns null when nothing is uncovered", () => {
		expect(
			pickPostponeCandidate(commitments.map((commitment) => ({ ...commitment, remaining: 0 }))),
		).toBeNull();
	});
});

describe("computeCoverFromSavingsSplit", () => {
	it("allocates up to savings remaining across uncovered envelopes", () => {
		expect(computeCoverFromSavingsSplit({ needs: 180_000, wants: 24_000 }, 150_000)).toEqual({
			needs: 132_353,
			wants: 17_647,
			total: 150_000,
		});
	});

	it("caps transfer at total uncovered", () => {
		expect(computeCoverFromSavingsSplit({ needs: 50_000, wants: 0 }, 200_000)).toEqual({
			needs: 50_000,
			wants: 0,
			total: 50_000,
		});
	});

	it("returns zero when savings is empty", () => {
		expect(computeCoverFromSavingsSplit({ needs: 80_000, wants: 20_000 }, 0)).toEqual({
			needs: 0,
			wants: 0,
			total: 0,
		});
	});
});

describe("buildCoverFromSavingsOption", () => {
	it("builds canon copy without touching emergency fund", () => {
		const option = buildCoverFromSavingsOption(18_000, "S/");

		expect(option.id).toBe("cover_from_savings");
		expect(option.title).toContain("S/ 180.00");
		expect(option.subtitle).toContain("Fondo de emergencia");
	});
});

describe("buildPostponeOption", () => {
	it("builds postpone copy with freed amount", () => {
		const option = buildPostponeOption(
			{
				id: "spotify",
				name: "Spotify",
				amount: 2_400,
				remaining: 2_400,
				envelope: "wants",
				dueDay: 18,
			},
			"S/",
		);

		expect(option.id).toBe("postpone_spotify");
		expect(option.title).toContain("Spotify");
		expect(option.subtitle).toContain("S/ 24.00");
	});
});
