import type { CreateProfileArgs } from "@/shared/lib/onboarding/types";
import { fixtureId } from "./convex-id";

export const onboardingProfileId = fixtureId("profiles", "profile_onboarding_example");

/** Perfil fijo mensual, el default del paso 1. El id no se muestra en la UI. */
export const onboardingFixedProfile = {
	profileId: onboardingProfileId,
	country: "PE",
	currencyCode: "PEN",
	currencySymbol: "S/",
	incomeModel: "fixed",
	payFrequency: "monthly",
	paydays: [1],
	allocationNeeds: 50,
	allocationWants: 30,
	allocationSavings: 20,
} satisfies CreateProfileArgs & { profileId: typeof onboardingProfileId };

export const onboardingVariableSources = ["Recibos", "Ventas"] satisfies readonly string[];
