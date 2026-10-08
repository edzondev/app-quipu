import { requireOnboardedProfile } from "@/auth/auth-server";
import { pageMetadata } from "@/core/seo";
import { EmergencyFundDetailView } from "@/modules/savings/components/emergency-fund-detail-view";

export const metadata = pageMetadata({
	title: "Fondo de emergencia",
	path: "/savings/fund",
});

export default async function SavingsFundPage() {
	await requireOnboardedProfile();

	return <EmergencyFundDetailView />;
}
