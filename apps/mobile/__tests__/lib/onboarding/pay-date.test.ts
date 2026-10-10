import {
	formatPayDate,
	isAllowedPayDate,
	payDateBounds,
	payDateToPickerDate,
	pickerDateToPayDate,
} from "@/shared/lib/onboarding/pay-date";

/** 9 oct 2026, 15:30 en Lima (UTC-5). */
const NOW = Date.parse("2026-10-09T15:30:00-05:00");

describe("payDateBounds", () => {
	it("acepta desde mañana hasta hoy + 31 días de Lima", () => {
		expect(payDateBounds(NOW)).toEqual({ earliest: "2026-10-10", latest: "2026-11-09" });
		expect(isAllowedPayDate("2026-10-10", NOW)).toBe(true);
		expect(isAllowedPayDate("2026-11-09", NOW)).toBe(true);
		expect(isAllowedPayDate("2026-10-09", NOW)).toBe(false);
		expect(isAllowedPayDate("2026-11-10", NOW)).toBe(false);
	});

	it("usa el día de Lima cuando UTC ya cambió de fecha", () => {
		const lateLima = Date.parse("2026-10-10T03:30:00Z");
		expect(payDateBounds(lateLima)).toEqual({ earliest: "2026-10-10", latest: "2026-11-09" });
		expect(isAllowedPayDate("2026-10-09", lateLima)).toBe(false);
	});

	it("rechaza días imposibles", () => {
		for (const day of ["", "2026-10-9", "2026/10/10", "hoy", "2026-02-31"]) {
			expect(isAllowedPayDate(day, NOW)).toBe(false);
		}
	});

	it("el picker conserva el día de calendario que se envía", () => {
		expect(pickerDateToPayDate(payDateToPickerDate("2026-10-20"))).toBe("2026-10-20");
		expect(formatPayDate("2026-10-20")).toBe("20 oct 2026");
	});
});
