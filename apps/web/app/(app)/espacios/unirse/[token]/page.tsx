import { requireAuthenticatedSession } from "@/auth/auth-server";
import { pageMetadata } from "@/core/seo";
import { SpaceInviteAcceptView } from "@/modules/espacios/components/space-invite-accept-view";

type Props = {
	params: Promise<{ token: string }>;
};

export async function generateMetadata({ params }: Props) {
	const { token } = await params;
	return pageMetadata({
		title: "Unirse al espacio",
		path: `/espacios/unirse/${token}`,
	});
}

export default async function SpaceInviteAcceptPage({ params }: Props) {
	const { token } = await params;
	await requireAuthenticatedSession(`/espacios/unirse/${token}`);
	return (
		<div className="mx-auto w-full max-w-2xl px-5 py-8 md:px-0">
			<SpaceInviteAcceptView token={token} />
		</div>
	);
}
