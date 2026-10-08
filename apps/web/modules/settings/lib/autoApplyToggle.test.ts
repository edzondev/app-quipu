import { describe, expect, it } from "vitest";
import {
	activeOptimisticAutoApply,
	decideAutoApplyToggle,
	dropOptimisticKey,
	patchAutoApply,
} from "./autoApplyToggle";

const ALL_OFF = {
	cts: false,
	gratifications: false,
	corporate_bonus: false,
	profit_sharing: false,
	custom: false,
} as const;

describe("decideAutoApplyToggle", () => {
	it("opens paywall for free users", () => {
		expect(
			decideAutoApplyToggle({
				isPremium: false,
				pending: false,
				currentChecked: false,
				nextChecked: true,
			}),
		).toBe("paywall");
	});

	it("skips while a toggle request is in flight", () => {
		expect(
			decideAutoApplyToggle({
				isPremium: true,
				pending: true,
				currentChecked: false,
				nextChecked: true,
			}),
		).toBe("skip");
	});

	it("skips no-op clicks (idempotent)", () => {
		expect(
			decideAutoApplyToggle({
				isPremium: true,
				pending: false,
				currentChecked: true,
				nextChecked: true,
			}),
		).toBe("skip");
	});

	it("mutates when premium and value changes", () => {
		expect(
			decideAutoApplyToggle({
				isPremium: true,
				pending: false,
				currentChecked: false,
				nextChecked: true,
			}),
		).toBe("mutate");
	});
});

describe("patchAutoApply", () => {
	it("returns a new map with one key flipped", () => {
		const next = patchAutoApply({ ...ALL_OFF }, "cts", true);
		expect(next.cts).toBe(true);
		expect(next.gratifications).toBe(false);
	});
});

describe("activeOptimisticAutoApply", () => {
	it("keeps overrides that still differ from server", () => {
		expect(activeOptimisticAutoApply({ ...ALL_OFF }, { cts: true })).toEqual({
			cts: true,
		});
	});

	it("drops overrides once server caught up (no effect needed)", () => {
		expect(activeOptimisticAutoApply({ ...ALL_OFF, cts: true }, { cts: true })).toBeNull();
	});
});

describe("dropOptimisticKey", () => {
	it("removes one key and nulls when empty", () => {
		expect(dropOptimisticKey({ cts: true }, "cts")).toBeNull();
		expect(dropOptimisticKey({ cts: true, custom: false }, "cts")).toEqual({
			custom: false,
		});
	});
});
