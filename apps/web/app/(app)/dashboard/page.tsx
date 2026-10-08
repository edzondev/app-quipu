import { requireOnboardedProfile } from "@/auth/auth-server";
import { pageMetadata } from "@/core/seo";
import { DashboardView } from "@/modules/dashboard/components/dashboard-view";

export const metadata = pageMetadata({
	title: "Inicio",
	path: "/dashboard",
});

export default async function DashboardPage() {
	const profile = await requireOnboardedProfile();

	return <DashboardView profileName={profile.name} />;
}
