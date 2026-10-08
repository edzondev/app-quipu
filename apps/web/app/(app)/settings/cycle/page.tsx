import { requireOnboardedProfile } from "@/auth/auth-server";
import { pageMetadata } from "@/core/seo";
import { CycleChangeWizard } from "@/modules/settings/components/cycle-change-wizard";

export const metadata = pageMetadata({
	title: "Ciclo de ingresos",
	path: "/settings/cycle",
});

export default async function SettingsCyclePage() {
	await requireOnboardedProfile();

	return <CycleChangeWizard />;
}
