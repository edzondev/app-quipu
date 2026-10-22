import { tabStackScreenOptions } from "@/shared/lib/navigation/tab-stack-options";

describe("tabStackScreenOptions", () => {
	it("pinta el stack con el fondo del tema, no el blanco por defecto", () => {
		const options = tabStackScreenOptions("#faf9f5");
		expect(options.headerShown).toBe(false);
		expect(options.contentStyle).toEqual({
			flex: 1,
			backgroundColor: "#faf9f5",
		});
	});
});
