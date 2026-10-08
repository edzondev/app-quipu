import { readActionError } from "@/shared/lib/expenses/errors";

describe("readActionError", () => {
	it("prefiere el mensaje de ConvexError.data", () => {
		const error = {
			data: {
				code: "ENVELOPE_FROZEN",
				message: "Este sobre está congelado temporalmente.",
			},
		};
		expect(readActionError(error, "fallback")).toBe("Este sobre está congelado temporalmente.");
	});

	it("usa Error.message cuando no hay data.message", () => {
		expect(readActionError(new Error("red caída"), "fallback")).toBe("red caída");
	});

	it("cae al texto de respaldo si el error no trae mensaje", () => {
		expect(readActionError(null, "No se pudo guardar.")).toBe("No se pudo guardar.");
	});
});
