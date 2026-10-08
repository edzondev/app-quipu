import Link from "next/link";
import { Calendar } from "reicon-react/icons/Calendar";
import { Check } from "reicon-react/icons/Check";
import { CommitmentCoverageList } from "@/shared/components/commitments/commitment-coverage-list";
import { buttonVariants } from "@/shared/components/ui/button-variants";
import { SectionLink } from "@/shared/components/ui/section-link";
import { cn } from "@/shared/lib/utils";
import {
	COMMITMENTS_COVERED_HEADER,
	COMMITMENTS_EMPTY_BODY,
	COMMITMENTS_EMPTY_CTA,
	COMMITMENTS_EMPTY_TITLE,
	COMMITMENTS_SECTION_LABEL,
	COMMITMENTS_UNCOVERED_HEADER,
	COMMITMENTS_VIEW_ALL,
} from "../constants";
import { allCommitmentsCovered } from "../lib/dashboard-math";
import type { DashboardCommitment } from "../types";

type Props = {
	commitments: DashboardCommitment[];
	currencyCode: string;
	isEarlyCycle?: boolean;
};

function CommitmentsEmptyState() {
	return (
		<div className="flex flex-col items-center px-2 py-3 text-center md:px-4 md:py-6">
			<span
				className="mb-3 flex size-10 items-center justify-center rounded-[11px] bg-surface-warm"
				aria-hidden
			>
				<Calendar size={18} color="var(--mute)" />
			</span>
			<p className="text-sm font-semibold text-ink">{COMMITMENTS_EMPTY_TITLE}</p>
			<p className="mt-2 max-w-xs text-sm leading-relaxed text-mute">{COMMITMENTS_EMPTY_BODY}</p>
			<Link
				href="/commitments"
				className={cn(
					buttonVariants({ variant: "outline" }),
					"mt-4 rounded-[11px] border-line px-4 text-ink-secondary",
				)}
			>
				{COMMITMENTS_EMPTY_CTA}
			</Link>
		</div>
	);
}

export function CommitmentsList({ commitments, currencyCode, isEarlyCycle = false }: Props) {
	const covered = allCommitmentsCovered(commitments);
	const showRichEmpty = isEarlyCycle && commitments.length === 0;
	const showViewAll = commitments.length > 0 && !showRichEmpty;

	return (
		<section
			aria-labelledby="dashboard-commitments"
			className="rounded-xl border border-line/70 bg-card p-3 md:p-5"
		>
			<div className="mb-2.5 flex items-center justify-between gap-3 md:mb-3.5">
				<h2 id="dashboard-commitments" className="text-sm font-semibold text-ink md:text-[14.5px]">
					{COMMITMENTS_SECTION_LABEL}
				</h2>
				<div className="flex items-center gap-2">
					{showViewAll ? (
						<SectionLink href="/commitments">{COMMITMENTS_VIEW_ALL}</SectionLink>
					) : null}
					{!showRichEmpty ? (
						<span className="inline-flex items-center gap-1.5 text-xs font-semibold text-qp-deep">
							{covered ? (
								<>
									<span className="flex size-4 items-center justify-center rounded-full bg-qp-soft">
										<Check size={10} color="var(--qp)" strokeWidth={3} aria-hidden />
									</span>
									{COMMITMENTS_COVERED_HEADER}
								</>
							) : (
								COMMITMENTS_UNCOVERED_HEADER
							)}
						</span>
					) : null}
				</div>
			</div>

			{showRichEmpty ? (
				<CommitmentsEmptyState />
			) : commitments.length === 0 ? (
				<p className="text-sm text-mute">
					Aún no tienes compromisos registrados.{" "}
					<SectionLink href="/commitments" variant="inline">
						Ver compromisos
					</SectionLink>
				</p>
			) : (
				<div className="-mx-4 overflow-hidden md:-mx-5">
					<CommitmentCoverageList commitments={commitments} currencyCode={currencyCode} />
				</div>
			)}
		</section>
	);
}
