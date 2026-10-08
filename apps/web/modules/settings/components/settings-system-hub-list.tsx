"use client";

import Link from "next/link";
import { AnalyticsEvents, track } from "@/core/analytics";
import { ListRowChevron } from "@/shared/components/ui/list-row-chevron";
import { cn } from "@/shared/lib/utils";
import {
	SETTINGS_COMMITMENTS_LABEL,
	SETTINGS_CORRECT_CYCLE_HINT,
	SETTINGS_CORRECT_CYCLE_LABEL,
	SETTINGS_CYCLE_LABEL,
	SETTINGS_EXTRAORDINARY_LABEL,
	SETTINGS_PERCENTAGES_LABEL,
	SETTINGS_PREFERENCES_LABEL,
} from "../constants";

function envelopeDotClass(type: "needs" | "wants" | "savings") {
	switch (type) {
		case "needs":
			return "bg-needs";
		case "wants":
			return "bg-clay";
		case "savings":
			return "bg-moss";
	}
}

type Props = {
	needs: number;
	wants: number;
	savings: number;
	cycleDays: number;
	commitmentCount: number;
};

export function SettingsSystemHubList({
	needs,
	wants,
	savings,
	cycleDays,
	commitmentCount,
}: Props) {
	return (
		<div className="rounded-xl border border-line/70 bg-card px-4 py-0.5">
			<Link
				href="/settings/allocations"
				className="flex min-h-11 items-center gap-2 border-b border-line/50 py-2.5 transition-colors hover:bg-surface-warm/40"
			>
				<span className="min-w-0 flex-1 truncate text-[13.5px] text-ink">
					{SETTINGS_PERCENTAGES_LABEL}
				</span>
				<span className="flex shrink-0 gap-0.5" aria-hidden>
					<span className={cn("size-1.5 rounded-full", envelopeDotClass("needs"))} />
					<span className={cn("size-1.5 rounded-full", envelopeDotClass("wants"))} />
					<span className={cn("size-1.5 rounded-full", envelopeDotClass("savings"))} />
				</span>
				<span className="shrink-0 text-[11.5px] tabular-nums text-faint">
					{needs}/{wants}/{savings}
				</span>
				<ListRowChevron />
			</Link>
			<Link
				href="/settings/system#compromisos"
				className="flex min-h-11 items-center gap-2 border-b border-line/50 py-2.5 transition-colors hover:bg-surface-warm/40"
			>
				<span className="min-w-0 flex-1 truncate text-[13.5px] text-ink">
					{SETTINGS_COMMITMENTS_LABEL}
				</span>
				<span className="shrink-0 text-[11.5px] tabular-nums text-faint">{commitmentCount}</span>
				<ListRowChevron />
			</Link>
			<Link
				href="/settings/cycle"
				className="flex min-h-11 items-center gap-2 border-b border-line/50 py-2.5 transition-colors hover:bg-surface-warm/40"
			>
				<span className="min-w-0 flex-1 truncate text-[13.5px] text-ink">
					{SETTINGS_CYCLE_LABEL}
				</span>
				<span className="shrink-0 text-[11.5px] text-faint">{cycleDays} días</span>
				<ListRowChevron />
			</Link>
			<Link
				href="/cycle/correct"
				className="flex min-h-11 items-center gap-2 border-b border-line/50 py-2.5 transition-colors hover:bg-surface-warm/40"
				onClick={() =>
					track(AnalyticsEvents.ALLOCATION_CORRECT_CTA_CLICKED, {
						source: "settings",
					})
				}
			>
				<span className="min-w-0 flex-1">
					<span className="block truncate text-[13.5px] text-ink">
						{SETTINGS_CORRECT_CYCLE_LABEL}
					</span>
					<span className="block truncate text-[11px] text-faint">
						{SETTINGS_CORRECT_CYCLE_HINT}
					</span>
				</span>
				<ListRowChevron />
			</Link>
			<Link
				href="/settings/system#preferencias"
				className="flex min-h-11 items-center gap-2 border-b border-line/50 py-2.5 transition-colors hover:bg-surface-warm/40"
			>
				<span className="min-w-0 flex-1 truncate text-[13.5px] text-ink">
					{SETTINGS_PREFERENCES_LABEL}
				</span>
				<ListRowChevron />
			</Link>
			<Link
				href="/settings/system#automatizaciones"
				className="flex min-h-11 items-center gap-2 py-2.5 transition-colors hover:bg-surface-warm/40"
			>
				<span className="min-w-0 flex-1 truncate text-[13.5px] text-ink">
					{SETTINGS_EXTRAORDINARY_LABEL}
				</span>
				<ListRowChevron />
			</Link>
		</div>
	);
}
