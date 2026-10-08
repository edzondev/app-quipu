import { requireOnboardedProfile } from "@/auth/auth-server";
import { pageMetadata } from "@/core/seo";
import { MovementsView } from "@/modules/movements/components/movements-view";

export const metadata = pageMetadata({
	title: "Movimientos",
	path: "/movements",
});

export default async function MovementsPage() {
	await requireOnboardedProfile();

	return <MovementsView />;
}
