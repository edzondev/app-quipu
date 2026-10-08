import { describe, expect, it } from "vitest";
import {
	isMovementInflow,
	movementAmountClassName,
	movementAmountPrefix,
} from "./movement-amount-display";

describe("movementAmountDisplay", () => {
	it("marks contributions and income as inflow", () => {
		expect(isMovementInflow("contribution")).toBe(true);
		expect(isMovementInflow("income")).toBe(true);
		expect(isMovementInflow("expense")).toBe(false);
	});

	it("uses qp-deep and plus for inflow", () => {
		expect(movementAmountClassName("contribution")).toBe("text-qp-deep");
		expect(movementAmountPrefix("contribution")).toBe("+");
	});

	it("uses danger ink and minus for expenses", () => {
		expect(movementAmountClassName("expense")).toBe("text-danger-ink");
		expect(movementAmountPrefix("expense")).toBe("−");
	});
});
