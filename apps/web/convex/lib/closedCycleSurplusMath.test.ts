import { describe, expect, it } from "vitest";
import { isOwnedSavingsSubEnvelope } from "./closedCycleSurplusMath";

describe("isOwnedSavingsSubEnvelope", () => {
	it("acepta el Fondo y cualquier sub-sobre de ahorro del usuario", () => {
		expect(
			isOwnedSavingsSubEnvelope(
				{ profileId: "profile-a", parentEnvelopeType: "savings" },
				"profile-a",
			),
		).toBe(true);
	});

	it("rechaza un sub-sobre de otro usuario", () => {
		expect(
			isOwnedSavingsSubEnvelope(
				{ profileId: "profile-b", parentEnvelopeType: "savings" },
				"profile-a",
			),
		).toBe(false);
	});

	it("rechaza un sub-sobre que no es de ahorro", () => {
		expect(
			isOwnedSavingsSubEnvelope(
				{ profileId: "profile-a", parentEnvelopeType: "needs" },
				"profile-a",
			),
		).toBe(false);
	});

	it("rechaza un destino inexistente", () => {
		expect(isOwnedSavingsSubEnvelope(null, "profile-a")).toBe(false);
	});
});
