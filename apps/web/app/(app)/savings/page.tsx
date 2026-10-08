import { requireOnboardedProfile } from "@/auth/auth-server";
import { pageMetadata } from "@/core/seo";
import { SavingsView } from "@/modules/savings/components/savings-view";

export const metadata = pageMetadata({
	title: "Ahorros",
	path: "/savings",
});

export default async function SavingsPage() {
	await requireOnboardedProfile();

	return <SavingsView />;
}
