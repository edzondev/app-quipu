"use client";

import { useQuery } from "convex/react";
import { Calendar } from "reicon-react/icons/Calendar";
import { api } from "@/convex/_generated/api";
import { SectionLink } from "@/shared/components/ui/section-link";
import { formatCents } from "@/shared/lib/money";
import {
	UPCOMING_COMMITMENTS_BADGE_ARIA,
	UPCOMING_COMMITMENTS_DUE_IN_DAYS,
	UPCOMING_COMMITMENTS_DUE_TODAY,
	UPCOMING_COMMITMENTS_DUE_TOMORROW,
	UPCOMING_COMMITMENTS_VIEW_ALL,
} from "../constants";

type Props = {
	currencyCode: string;
	isPremium: boolean;
};

function dueLabel(daysUntilDue: number): string {
	if (daysUntilDue === 0) return UPCOMING_COMMITMENTS_DUE_TODAY;
	if (daysUntilDue === 1) return UPCOMING_COMMITMENTS_DUE_TOMORROW;
	return UPCOMING_COMMITMENTS_DUE_IN_DAYS(daysUntilDue);
}

export function UpcomingCommitmentsBadge({ currencyCode, isPremium }: Props) {
	const upcoming = useQuery(api.upcomingCommitments.listUpcomingForBadge, isPremium ? {} : "skip");

	if (!isPremium || !upcoming?.badgeLabel || upcoming.items.length === 0) {
		return null;
	}

	return (
		<section
			aria-label={UPCOMING_COMMITMENTS_BADGE_ARIA}
			className="rounded-xl border border-warning-border bg-warning-bg/70 p-3 md:p-4"
		>
			<div className="flex flex-wrap items-center gap-2">
				<span className="inline-flex items-center gap-1.5 rounded-full bg-warning-border px-2.5 py-1 text-[11px] font-semibold text-warning-text">
					<Calendar size={14} color="currentColor" aria-hidden />
					{upcoming.badgeLabel}
				</span>
			</div>

			<ul className="mt-2 space-y-1.5 md:mt-3 md:space-y-2">
				{upcoming.items.map((item) => (
					<li
						key={item.id}
						className="flex items-start gap-2.5 rounded-[11px] border border-warning-border/70 bg-canvas/80 px-2.5 py-2 md:gap-3 md:px-3 md:py-2.5"
					>
						<span
							className="mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-[9px] bg-warning/15"
							aria-hidden
						>
							<Calendar size={14} color="var(--warning-text)" />
						</span>
						<span className="min-w-0 flex-1">
							<span className="block text-[13.5px] font-semibold text-ink">{item.name}</span>
							<span className="mt-0.5 block text-[11.5px] text-mute">
								{dueLabel(item.daysUntilDue)} · faltan{" "}
								{formatCents(item.remaining, { currency: currencyCode })}
							</span>
						</span>
					</li>
				))}
			</ul>

			<SectionLink href="/commitments" className="mt-3">
				{UPCOMING_COMMITMENTS_VIEW_ALL}
			</SectionLink>
		</section>
	);
}
