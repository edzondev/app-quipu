import { readFirstCycleError } from "@/shared/lib/onboarding/first-cycle-error";

describe("readFirstCycleError", () => {
	it("separa VALIDATION_ERROR por campo", () => {
		expect(
			readFirstCycleError({
				data: {
					code: "VALIDATION_ERROR",
					message: "Tu próxima fecha de cobro debe estar entre mañana y los próximos 31 días.",
					data: { field: "nextPayDate" },
				},
			}),
		).toEqual({
			code: "VALIDATION_ERROR",
			field: "nextPayDate",
			message: "Tu próxima fecha de cobro debe estar entre mañana y los próximos 31 días.",
		});
		expect(
			readFirstCycleError({
				data: {
					code: "VALIDATION_ERROR",
					message: "El saldo debe ser un entero de céntimos mayor o igual a cero.",
					data: { field: "openingBalanceCents" },
				},
			}),
		).toMatchObject({ code: "VALIDATION_ERROR", field: "openingBalanceCents" });
	});

	it("reconoce ALREADY_EXISTS y esconde errores desconocidos", () => {
		expect(
			readFirstCycleError({
				data: { code: "ALREADY_EXISTS", message: "Tu primer ciclo ya está creado." },
			}),
		).toEqual({ code: "ALREADY_EXISTS" });
		const unknown = readFirstCycleError(new Error("Server exploded profileId"));
		expect(unknown).toEqual({
			code: "OTHER",
			message: "No se pudo abrir tu ciclo. Intenta de nuevo.",
		});
		if (unknown.code === "OTHER") {
			expect(unknown.message).not.toContain("profileId");
		}
	});
});
