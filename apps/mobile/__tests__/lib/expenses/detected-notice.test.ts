import { formatDetectedWhen, readDetectedNotice } from "@/shared/lib/expenses/detected-notice";

const AT = Date.parse("2026-10-24T00:12:00.000Z");

describe("readDetectedNotice", () => {
	it("arma el aviso que trae el toque", () => {
		expect(
			readDetectedNotice({
				id: "n|1",
				cents: "4590",
				merchant: "Tambo+",
				bank: "Interbank",
				at: String(AT),
			}),
		).toEqual({
			id: "n|1",
			amountCents: 4590,
			merchant: "Tambo+",
			bank: "Interbank",
			postedAt: AT,
		});
	});

	it("deja el monto vacío cuando el aviso no lo trae", () => {
		expect(
			readDetectedNotice({
				id: ["n|2"],
				cents: undefined,
				merchant: "",
				bank: "Interbank",
				at: "no",
			}),
		).toEqual({
			id: "n|2",
			amountCents: null,
			merchant: "",
			bank: "Interbank",
			postedAt: 0,
		});
	});

	it("rechaza un toque sin id", () => {
		expect(readDetectedNotice({ id: "", cents: "100", merchant: "", bank: "", at: "" })).toBeNull();
	});
});

describe("formatDetectedWhen", () => {
	it("muestra la hora de Lima", () => {
		expect(formatDetectedWhen(AT)).toBe("19:12");
		expect(formatDetectedWhen(0)).toBe("");
	});
});
