import { requireOnboardedProfile } from "@/auth/auth-server";
import type { Id } from "@/convex/_generated/dataModel";
import { pageMetadata } from "@/core/seo";
import { MoveSurplusView } from "@/modules/savings/components/move-surplus-view";
import { MOVE_SURPLUS_PAGE_TITLE } from "@/modules/savings/constants";

export const metadata = pageMetadata({
	title: MOVE_SURPLUS_PAGE_TITLE,
	path: "/savings/move",
});

type SearchParams = Promise<{ from?: string; amount?: string; to?: string }>;

function parseInitialAmountCents(raw: string | undefined): number | undefined {
	if (raw === undefined || raw === "") return undefined;
	const parsed = Number(raw);
	if (!Number.isInteger(parsed) || parsed <= 0) return undefined;
	return parsed;
}

function parseDestinationId(raw: string | undefined): Id<"subEnvelopes"> | undefined {
	if (raw === undefined || raw === "") return undefined;
	// Convex Ids are opaque strings; invalid ones are ignored by the form.
	return raw as Id<"subEnvelopes">;
}

export default async function MoveSurplusPage({ searchParams }: { searchParams: SearchParams }) {
	await requireOnboardedProfile();
	const params = await searchParams;
	const initialFromEnvelope =
		params.from === "needs" || params.from === "wants" || params.from === "extraordinary"
			? params.from
			: undefined;
	const initialAmountCents = parseInitialAmountCents(params.amount);
	const initialDestinationId = parseDestinationId(params.to);

	return (
		<MoveSurplusView
			initialFromEnvelope={initialFromEnvelope}
			initialAmountCents={initialAmountCents}
			initialDestinationId={initialDestinationId}
		/>
	);
}
