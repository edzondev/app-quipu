import { requireOnboardedProfile } from "@/auth/auth-server";
import { pageMetadata } from "@/core/seo";
import { SettingsAllocationsEditor } from "@/modules/settings/components/settings-allocations-editor";

export const metadata = pageMetadata({
	title: "Distribución de sobres",
	path: "/settings/allocations",
});

export default async function SettingsAllocationsPage() {
	const profile = await requireOnboardedProfile();

	return (
		<SettingsAllocationsEditor
			initialAllocation={{
				allocationNeeds: profile.allocationNeeds,
				allocationWants: profile.allocationWants,
				allocationSavings: profile.allocationSavings,
			}}
		/>
	);
}
