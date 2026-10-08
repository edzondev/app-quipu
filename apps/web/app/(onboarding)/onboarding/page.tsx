import { redirect } from "next/navigation";
import { getMyProfileRsc } from "@/auth/auth-server";
import { pageMetadata } from "@/core/seo";
import { OnboardingWizard } from "@/modules/onboarding/components/onboarding-wizard";

export const metadata = pageMetadata({
	title: "Configuración inicial",
	path: "/onboarding",
});

export default async function OnboardingPage() {
	const profile = await getMyProfileRsc();
	if (profile) {
		redirect("/dashboard");
	}
	return <OnboardingWizard />;
}
