import { requireOnboardedProfile } from "@/auth/auth-server";
import { pageMetadata } from "@/core/seo";
import { ProgressView } from "@/modules/progress/components/progress-view";

export const metadata = pageMetadata({
	title: "Progreso",
	path: "/progress",
});

export default async function ProgressPage() {
	await requireOnboardedProfile();

	return <ProgressView />;
}
