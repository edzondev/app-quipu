import { Suspense } from "react";
import { requireOnboardedProfile } from "@/auth/auth-server";
import { pageMetadata } from "@/core/seo";
import { SettingsView } from "@/modules/settings/components/settings-view";

export const metadata = pageMetadata({
	title: "Ajustes",
	path: "/settings",
});

export default async function SettingsPage() {
	await requireOnboardedProfile();

	return (
		<Suspense>
			<SettingsView />
		</Suspense>
	);
}
