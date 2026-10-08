import { Suspense } from "react";
import { requireOnboardedProfile } from "@/auth/auth-server";
import { pageMetadata } from "@/core/seo";
import {
	SettingsAccountView,
	SettingsAccountViewSkeleton,
} from "@/modules/settings/components/settings-account-view";

export const metadata = pageMetadata({
	title: "Cuenta",
	path: "/settings/account",
});

export default async function SettingsAccountPage() {
	await requireOnboardedProfile();

	return (
		<Suspense fallback={<SettingsAccountViewSkeleton />}>
			<SettingsAccountView />
		</Suspense>
	);
}
