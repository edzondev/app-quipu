"use client";

import { useMutation, useQuery } from "convex/react";
import { useTheme } from "next-themes";
import { api } from "@/convex/_generated/api";
import { AppPageShell } from "@/shared/components/layout/app-page-shell";
import { buttonVariants } from "@/shared/components/ui/button-variants";
import { Skeleton } from "@/shared/components/ui/skeleton";
import { cn } from "@/shared/lib/utils";
import {
	PROGRESS_ERROR_BODY,
	PROGRESS_ERROR_RETRY,
	PROGRESS_ERROR_TITLE,
	REWARDS_ACTIVATE,
	REWARDS_ACTIVE,
	REWARDS_CYCLES_MORE,
	REWARDS_PAGE_SUBTITLE,
	REWARDS_PAGE_TITLE,
	REWARDS_THEME_HINT,
} from "../constants";

export function ProgressRewardsView() {
	const rewards = useQuery(api.progress.getRewards, {});
	const updateAppearance = useMutation(api.progress.updateAppearance);
	const { setTheme } = useTheme();

	if (rewards === undefined) {
		return (
			<AppPageShell maxWidth="4xl" breadcrumbs="auto">
				<Skeleton className="h-8 w-40 rounded-lg" />
				<Skeleton className="mt-4 h-32 w-full rounded-xl [animation-delay:150ms]" />
			</AppPageShell>
		);
	}

	if (rewards === null) {
		return (
			<section className="rounded-xl border border-danger-line bg-danger-bg p-5 md:p-6">
				<h2 className="text-base font-semibold text-danger-ink">{PROGRESS_ERROR_TITLE}</h2>
				<p className="mt-2 text-sm text-danger-text">{PROGRESS_ERROR_BODY}</p>
				<button
					type="button"
					className={cn(
						buttonVariants({ variant: "outline" }),
						"mt-4 border-danger-line text-danger-ink hover:bg-danger-banner",
					)}
					onClick={() => window.location.reload()}
				>
					{PROGRESS_ERROR_RETRY}
				</button>
			</section>
		);
	}

	return (
		<AppPageShell maxWidth="4xl" breadcrumbs="auto">
			<header className="mb-6">
				<h1 className="font-serif text-[22px] font-medium text-ink md:text-[24px]">
					{REWARDS_PAGE_TITLE}
				</h1>
				<p className="mt-1 text-[13px] text-mute-subtle">{REWARDS_PAGE_SUBTITLE}</p>
			</header>

			<div className="mb-4 flex flex-col gap-2.5">
				{rewards.rewards.map((reward) => {
					const locked = !reward.unlocked;
					const isTheme = reward.id === "tinta_theme";
					const isAccent = reward.id === "clay_accent";

					return (
						<div
							key={reward.id}
							className={cn(
								"flex items-center gap-3 rounded-xl border px-4 py-3.5 md:gap-3.5 md:px-5",
								locked
									? "border-dashed border-line/70 bg-surface-soft opacity-75"
									: "border-line/70 bg-card",
							)}
						>
							<span
								className={cn(
									"flex size-9 shrink-0 items-center justify-center rounded-[11px] md:size-[38px]",
									isTheme
										? "bg-[#23201C]"
										: isAccent
											? "border border-[#E7D9C8] bg-[#F2EDE7]"
											: "border border-dashed border-[#C9C3BA]",
								)}
								aria-hidden
							/>
							<div className="min-w-0 flex-1">
								<div
									className={cn(
										"text-[12.5px] font-semibold md:text-sm",
										locked ? "text-ink-secondary" : "text-ink",
									)}
								>
									{reward.title}
								</div>
								<div
									className={cn(
										"text-[10.5px] md:text-xs",
										locked ? "text-faint" : "text-mute-subtle",
									)}
								>
									{reward.description}
								</div>
							</div>
							{locked ? (
								<span className="text-[11.5px] text-faint">
									{"cyclesRemaining" in reward && reward.cyclesRemaining != null
										? REWARDS_CYCLES_MORE(reward.cyclesRemaining)
										: `${Math.max(0, reward.requiredStreak - rewards.currentStreak)} ciclos más`}
								</span>
							) : reward.id === "annual_report" ? (
								<span className="rounded-full bg-qp-tint px-2.5 py-1 text-[11.5px] font-semibold text-qp-deep">
									Pronto
								</span>
							) : isAccent ? (
								<span className="rounded-full bg-surface-warm px-2.5 py-1 text-[11.5px] font-semibold text-mute">
									Pronto
								</span>
							) : (
								<button
									type="button"
									className={cn(
										"rounded-full px-2.5 py-1 text-[10.5px] font-semibold md:text-[11.5px]",
										reward.active
											? "bg-qp-tint text-qp-deep"
											: "bg-qp-tint text-qp-deep hover:bg-qp-border",
									)}
									onClick={() => {
										setTheme("dark");
										void updateAppearance({ appearanceTheme: "tinta" });
									}}
								>
									{reward.active ? REWARDS_ACTIVE : REWARDS_ACTIVATE}
								</button>
							)}
						</div>
					);
				})}
			</div>

			<p className="text-[12.5px] text-mute-subtle">{REWARDS_THEME_HINT}</p>
		</AppPageShell>
	);
}
