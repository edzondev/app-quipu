import { requireAuthenticatedProfile } from "@/auth/auth-server";
import type { Id } from "@/convex/_generated/dataModel";
import { pageMetadata } from "@/core/seo";
import { SpaceDashboardView } from "@/modules/espacios/components/space-dashboard-view";

type Props = {
	params: Promise<{ spaceId: string }>;
};

export async function generateMetadata({ params }: Props) {
	const { spaceId } = await params;
	return pageMetadata({
		title: "Espacio compartido",
		path: `/espacios/${spaceId}`,
	});
}

export default async function SpaceDashboardPage({ params }: Props) {
	await requireAuthenticatedProfile();
	const { spaceId } = await params;
	return <SpaceDashboardView spaceId={spaceId as Id<"financialSpaces">} />;
}
