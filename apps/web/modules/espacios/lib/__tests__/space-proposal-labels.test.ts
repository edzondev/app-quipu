import { describe, expect, it } from "vitest";
import { formatSpaceProposalLabel } from "../space-proposal-labels";
import { canEditSpaceSettingsSection } from "../space-settings-permissions";

describe("formatSpaceProposalLabel", () => {
	it("formats allocation proposals", () => {
		expect(
			formatSpaceProposalLabel("allocation", {
				allocationNeeds: 50,
				allocationWants: 30,
				allocationSavings: 20,
			}),
		).toBe("Cambiar distribución a 50% necesidades · 30% gustos · 20% ahorro");
	});

	it("formats cycle duration proposals", () => {
		expect(formatSpaceProposalLabel("cycle_duration", { cycleDurationDays: 15 })).toBe(
			"Cambiar duración del ciclo a 15 días",
		);
	});

	it("formats expected contribution proposals with member name", () => {
		expect(
			formatSpaceProposalLabel(
				"expected_contribution",
				{ profileId: "p1", expectedContributionCents: 50_000 },
				{ memberName: "Edzon", currencyCode: "PEN" },
			),
		).toContain("Meta de Edzon");
	});
});

describe("canEditSpaceSettingsSection", () => {
	it("allows owner to edit structural sections when writable", () => {
		expect(
			canEditSpaceSettingsSection("owner", "active", "allocation", {
				isWritable: true,
			}),
		).toBe(true);
	});

	it("blocks member from editing allocation", () => {
		expect(
			canEditSpaceSettingsSection("member", "active", "allocation", {
				isWritable: true,
			}),
		).toBe(false);
	});

	it("allows member to edit own contribution goal", () => {
		expect(
			canEditSpaceSettingsSection("member", "active", "contribution", {
				isWritable: true,
				targetIsSelf: true,
			}),
		).toBe(true);
	});

	it("allows reactivate only for owner when eligible", () => {
		expect(
			canEditSpaceSettingsSection("owner", "readonly", "reactivate", {
				canReactivate: true,
			}),
		).toBe(true);
		expect(
			canEditSpaceSettingsSection("member", "readonly", "reactivate", {
				canReactivate: true,
			}),
		).toBe(false);
	});
});
