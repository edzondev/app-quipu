import { formatPostedAtLima, truncateProbeText } from "@/shared/lib/native-probe/format";

describe("native probe format", () => {
	it("formatea la hora en Lima", () => {
		const formatted = formatPostedAtLima(Date.UTC(2026, 9, 10, 15, 30));
		expect(formatted.startsWith("10/10/2026")).toBe(true);
		expect(formatted.includes("10:30")).toBe(true);
	});

	it("recorta el texto a unos 80 caracteres", () => {
		expect(truncateProbeText("  hola   mundo  ")).toBe("hola mundo");
		const long = "a".repeat(90);
		expect(truncateProbeText(long)).toBe(`${"a".repeat(80)}…`);
		expect(truncateProbeText(long).length).toBe(81);
	});
});
