import { describe, expect, it } from "vitest";
import { planInferredSavingsAnnulment } from "./inferredSavingsAnnulment";

describe("planInferredSavingsAnnulment", () => {
	it("writes down Fondo and LIFO additional surplus for the July inflation", () => {
		const result = planInferredSavingsAnnulment({
			annulCents: 17_647,
			fundCurrentAmount: 167_647,
			surplusRows: [
				{ id: "s1", amount: 99_080, contributionKind: "objective" },
				{ id: "s2", amount: 50_920, contributionKind: "additional" },
				{ id: "s3", amount: 17_647, contributionKind: "additional" },
			],
		});
		expect(result.fundAfter).toBe(150_000);
		expect(result.surplusDeletes).toEqual(["s3"]);
		expect(result.surplusPatches).toEqual([]);
	});

	it("partially reduces the newest additional row", () => {
		const result = planInferredSavingsAnnulment({
			annulCents: 10_000,
			fundCurrentAmount: 160_000,
			surplusRows: [
				{ id: "a", amount: 40_000, contributionKind: "additional" },
				{ id: "b", amount: 30_000, contributionKind: "additional" },
			],
		});
		expect(result.fundAfter).toBe(150_000);
		expect(result.surplusDeletes).toEqual([]);
		expect(result.surplusPatches).toEqual([{ id: "b", amount: 20_000 }]);
	});

	it("rejects when Fondo is too small", () => {
		expect(() =>
			planInferredSavingsAnnulment({
				annulCents: 20_000,
				fundCurrentAmount: 10_000,
				surplusRows: [{ id: "a", amount: 20_000 }],
			}),
		).toThrow(/Fondo/);
	});

	it("still writes down Fondo when surplus additional is smaller", () => {
		const result = planInferredSavingsAnnulment({
			annulCents: 20_000,
			fundCurrentAmount: 100_000,
			surplusRows: [
				{ id: "obj", amount: 80_000, contributionKind: "objective" },
				{ id: "add", amount: 5_000, contributionKind: "additional" },
			],
		});
		expect(result.fundAfter).toBe(80_000);
		expect(result.surplusDeletes).toEqual(["add"]);
		expect(result.surplusPatches).toEqual([]);
	});
});
