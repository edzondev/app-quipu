import { describe, expect, it } from "vitest";
import {
	appendKeypadDigit,
	backspaceKeypad,
	formatElapsedSeconds,
	formatKeypadDisplay,
	isKeypadAmountValid,
	KEYPAD_MAX_CENTS,
} from "../keypad";

describe("expense keypad", () => {
	it("appends digits as cent shifts", () => {
		expect(appendKeypadDigit(0, 4)).toBe(4);
		expect(appendKeypadDigit(4, 8)).toBe(48);
		expect(appendKeypadDigit(48, 0)).toBe(480);
	});

	it("rejects invalid digits and caps max", () => {
		expect(appendKeypadDigit(100, -1)).toBe(100);
		expect(appendKeypadDigit(KEYPAD_MAX_CENTS, 1)).toBe(KEYPAD_MAX_CENTS);
	});

	it("backspaces one digit", () => {
		expect(backspaceKeypad(480)).toBe(48);
		expect(backspaceKeypad(48)).toBe(4);
		expect(backspaceKeypad(0)).toBe(0);
	});

	it("formats display without thousand separator", () => {
		expect(formatKeypadDisplay(4800)).toBe("S/ 48.00");
		expect(formatKeypadDisplay(123456)).toBe("S/ 1234.56");
	});

	it("validates positive integer cents", () => {
		expect(isKeypadAmountValid(100)).toBe(true);
		expect(isKeypadAmountValid(0)).toBe(false);
		expect(isKeypadAmountValid(-1)).toBe(false);
	});

	it("formats elapsed seconds with minimum of 1", () => {
		expect(formatElapsedSeconds(1000, 1500)).toBe(1);
		expect(formatElapsedSeconds(0, 8500)).toBe(9);
	});
});
