import { limaDayLabel, limaMonthName, limaStamp } from "@/shared/lib/lima-date";

const AUG_16 = Date.UTC(2026, 7, 16, 17, 0, 0);

describe("limaStamp", () => {
	it("parte el día de Lima que usan Movimientos y Compromisos", () => {
		expect(limaStamp(AUG_16)).toMatchObject({
			key: "2026-08-16",
			day: 16,
			monthIndex: 7,
			time: "12:00",
		});
		expect(limaDayLabel(AUG_16)).toBe("16 AGO");
		expect(limaMonthName(AUG_16)).toBe("AGOSTO");
		expect(limaMonthName(Date.parse("2026-05-15T17:00:00.000Z"))).toBe("MAYO");
	});
});
