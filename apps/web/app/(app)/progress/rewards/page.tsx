import { requireOnboardedProfile } from "@/auth/auth-server";
import { pageMetadata } from "@/core/seo";
import { ProgressRewardsView } from "@/modules/progress/components/progress-rewards-view";

export const metadata = pageMetadata({
	title: "Recompensas",
	path: "/progress/rewards",
});

export default async function ProgressRewardsPage() {
	await requireOnboardedProfile();

	return <ProgressRewardsView />;
}
