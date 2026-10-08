import { requireOnboardedProfile } from "@/auth/auth-server";
import { pageMetadata } from "@/core/seo";
import { SettingsFeedbackView } from "@/modules/settings/components/settings-feedback-view";

export const metadata = pageMetadata({
	title: "Cuéntanos",
	path: "/settings/feedback",
});

export default async function SettingsFeedbackPage() {
	await requireOnboardedProfile();

	return <SettingsFeedbackView />;
}
