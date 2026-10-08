import Link from "next/link";
import { requireOnboardedProfile } from "@/auth/auth-server";
import { DEFAULT_CURRENCY } from "@/core/constants";
import { pageMetadata } from "@/core/seo";
import { MoveSurplusSuccessView } from "@/modules/savings/components/move-surplus-success-view";

export const metadata = pageMetadata({
	title: "Guardado",
	path: "/savings/move/success",
});

type SearchParams = Promise<{
	moved?: string;
	objective?: string;
	additional?: string;
	total?: string;
	needs?: string;
	wants?: string;
	savings?: string;
}>;

function parseCents(value: string | undefined): number {
	if (!value) return 0;
	const parsed = Number.parseInt(value, 10);
	return Number.isFinite(parsed) && parsed >= 0 ? parsed : 0;
}

function parsePercent(value: string | undefined, fallback: number): number {
	if (!value) return fallback;
	const parsed = Number.parseInt(value, 10);
	return Number.isFinite(parsed) && parsed >= 0 && parsed <= 100 ? parsed : fallback;
}

export default async function MoveSurplusSuccessPage({
	searchParams,
}: {
	searchParams: SearchParams;
}) {
	const profile = await requireOnboardedProfile();
	const params = await searchParams;

	const movedCents = parseCents(params.moved);
	if (movedCents <= 0) {
		return (
			<div className="mx-auto max-w-lg px-4 py-10 text-sm text-mute">
				No encontramos el detalle de tu movimiento.{" "}
				<Link href="/savings" className="font-medium text-qp-deep underline">
					Volver a ahorros
				</Link>
			</div>
		);
	}

	return (
		<MoveSurplusSuccessView
			currencyCode={profile.currencyCode ?? DEFAULT_CURRENCY.code}
			movedCents={movedCents}
			savingsObjectiveCents={parseCents(params.objective)}
			savingsAdditionalCents={parseCents(params.additional)}
			savingsTotalCents={parseCents(params.total)}
			allocationNeeds={parsePercent(params.needs, profile.allocationNeeds)}
			allocationWants={parsePercent(params.wants, profile.allocationWants)}
			allocationSavings={parsePercent(params.savings, profile.allocationSavings)}
		/>
	);
}
