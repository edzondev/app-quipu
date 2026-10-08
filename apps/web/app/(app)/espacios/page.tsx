import { requireAuthenticatedSession } from "@/auth/auth-server";
import { pageMetadata } from "@/core/seo";
import { EspaciosHubView } from "@/modules/espacios/components/espacios-hub-view";

export const metadata = pageMetadata({
	title: "Espacios",
	path: "/espacios",
});

export default async function EspaciosPage() {
	await requireAuthenticatedSession();
	return <EspaciosHubView />;
}
