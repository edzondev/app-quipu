import type { Metadata } from "next";
import { Suspense } from "react";
import { requireOnboardedProfile } from "@/auth/auth-server";
import { pageMetadata } from "@/core/seo";
import { CommitmentsView } from "@/modules/commitments/components/commitments-view";

export const metadata: Metadata = pageMetadata({
	title: "Compromisos",
	path: "/commitments",
});

export default async function CommitmentsPage() {
	await requireOnboardedProfile();

	return (
		<Suspense>
			<CommitmentsView />
		</Suspense>
	);
}
