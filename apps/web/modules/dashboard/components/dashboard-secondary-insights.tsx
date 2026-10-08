"use client";

import { useState } from "react";
import { ChevronDown } from "reicon-react/icons/ChevronDown";
import { useIsMobile } from "@/shared/hooks/use-mobile";
import { cn } from "@/shared/lib/utils";
import { DASHBOARD_SECONDARY_INSIGHTS_LABEL } from "../constants";
import { CycleForecastCard } from "./cycle-forecast-card";
import { UpcomingCommitmentsBadge } from "./upcoming-commitments-badge";

const PANEL_ID = "dashboard-secondary-insights-panel";
const TRIGGER_ID = "dashboard-secondary-insights-trigger";

type Props = {
	currencyCode: string;
	isPremium: boolean;
};

export function DashboardSecondaryInsights({ currencyCode, isPremium }: Props) {
	const [expanded, setExpanded] = useState(false);
	const isMobile = useIsMobile();
	const contentHidden = isMobile && !expanded;

	return (
		<div className="space-y-3 md:space-y-4">
			<button
				type="button"
				id={TRIGGER_ID}
				aria-expanded={expanded}
				aria-controls={PANEL_ID}
				onClick={() => setExpanded((open) => !open)}
				className="flex w-full items-center gap-2 rounded-xl border border-line/70 bg-surface-warm/40 px-3 py-2.5 text-left md:hidden"
			>
				<span className="text-[12.5px] font-medium text-ink-secondary">
					{DASHBOARD_SECONDARY_INSIGHTS_LABEL}
				</span>
				<ChevronDown
					size={16}
					color="var(--mute)"
					aria-hidden
					className={cn(
						"ml-auto shrink-0 transition-transform duration-200 motion-reduce:transition-none",
						expanded && "rotate-180",
					)}
				/>
			</button>

			<section
				id={PANEL_ID}
				aria-labelledby={TRIGGER_ID}
				aria-hidden={contentHidden || undefined}
				className={cn(
					"grid transition-[grid-template-rows] duration-200 ease-out motion-reduce:transition-none",
					expanded ? "grid-rows-[1fr]" : "grid-rows-[0fr] md:grid-rows-[1fr]",
				)}
			>
				<div className="overflow-hidden">
					<div className={cn("space-y-3 md:space-y-4", contentHidden && "max-md:invisible")}>
						<UpcomingCommitmentsBadge currencyCode={currencyCode} isPremium={isPremium} />
						<CycleForecastCard currencyCode={currencyCode} isPremium={isPremium} />
					</div>
				</div>
			</section>
		</div>
	);
}
