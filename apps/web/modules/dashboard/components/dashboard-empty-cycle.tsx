import Link from "next/link";
import { buttonVariants } from "@/shared/components/ui/button-variants";
import { cn } from "@/shared/lib/utils";
import {
	HERO_EMPTY_BODY,
	HERO_EMPTY_CTA,
	HERO_EMPTY_EYEBROW,
	HERO_EMPTY_TITLE,
} from "../constants";
import type { DashboardCommitment } from "../types";
import { CommitmentsList } from "./commitments-list";

type Props = {
	profileName: string;
	currencyCode: string;
	commitments: DashboardCommitment[];
};

export function DashboardEmptyCycle({ profileName, currencyCode, commitments }: Props) {
	return (
		<div className="space-y-5">
			<section className="rounded-xl border border-line/70 bg-linear-to-tr from-qp-gradient to-qp-gradient/10 p-5 shadow-[0_1px_2px_color-mix(in_oklch,var(--qp-ink)_3%,transparent)] md:p-7">
				<p className="font-mono text-[11px] uppercase tracking-[0.1em] text-qp-deep">
					{HERO_EMPTY_EYEBROW}
				</p>
				<h2 className="mt-2 font-serif text-[28px] font-medium leading-tight text-ink md:text-[40px]">
					{HERO_EMPTY_TITLE}, {profileName}
				</h2>
				<p className="mt-3 max-w-lg text-sm leading-relaxed text-ink-secondary md:text-[15px]">
					{HERO_EMPTY_BODY}
				</p>
				<Link
					href="/income/register"
					className={cn(
						buttonVariants(),
						"mt-5 inline-flex rounded-[11px] bg-ink px-5 text-canvas hover:bg-ink/90",
					)}
				>
					{HERO_EMPTY_CTA}
				</Link>
			</section>

			{commitments.length > 0 ? (
				<CommitmentsList commitments={commitments} currencyCode={currencyCode} />
			) : null}
		</div>
	);
}
