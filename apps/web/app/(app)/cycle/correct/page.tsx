import { requireOnboardedProfile } from "@/auth/auth-server";
import { pageMetadata } from "@/core/seo";
import { CycleCorrectWizard } from "@/modules/cycle-correction/components/cycle-correct-wizard";

export const metadata = pageMetadata({
	title: "Corregir ciclo",
	path: "/cycle/correct",
});

export default async function CycleCorrectPage() {
	await requireOnboardedProfile();

	return <CycleCorrectWizard />;
}
