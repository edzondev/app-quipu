import { describe, expect, it } from "vitest";
import { canReactivateSpace, shouldTransitionSpaceToReadonly } from "./spaceAuthLogic";

describe("spaceLifecycle", () => {
	it("marks active owner spaces readonly when premium lapses", () => {
		expect(shouldTransitionSpaceToReadonly({ status: "active" }, { plan: "free" })).toBe(true);
	});

	it("does not readonly closed spaces", () => {
		expect(shouldTransitionSpaceToReadonly({ status: "closed" }, { plan: "free" })).toBe(false);
	});

	it("reactivates readonly space when premium returns", () => {
		expect(canReactivateSpace({ status: "readonly" }, { plan: "premium" })).toBe(true);
	});
});
