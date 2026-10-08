import { requireAuthenticatedProfile } from "@/auth/auth-server";
import type { Id } from "@/convex/_generated/dataModel";
import { pageMetadata } from "@/core/seo";
import { SpaceSettingsView } from "@/modules/espacios/components/space-settings-view";

type Props = {
	params: Promise<{ spaceId: string }>;
};

export async function generateMetadata({ params }: Props) {
	const { spaceId } = await params;
	return pageMetadata({
		title: "Configuración del espacio",
		path: `/espacios/${spaceId}/configuracion`,
	});
}

export default async function SpaceSettingsPage({ params }: Props) {
	await requireAuthenticatedProfile();
	const { spaceId } = await params;
	return <SpaceSettingsView spaceId={spaceId as Id<"financialSpaces">} />;
}
