import { Suspense } from "react";
import { requireOnboardedProfile } from "@/auth/auth-server";
import { pageMetadata } from "@/core/seo";
import {
	SettingsSystemView,
	SettingsSystemViewSkeleton,
} from "@/modules/settings/components/settings-system-view";

export const metadata = pageMetadata({
	title: "Tu sistema",
	path: "/settings/system",
});

export default async function SettingsSystemPage() {
	await requireOnboardedProfile();

	return (
		<Suspense fallback={<SettingsSystemViewSkeleton />}>
			<SettingsSystemView />
		</Suspense>
	);
}
