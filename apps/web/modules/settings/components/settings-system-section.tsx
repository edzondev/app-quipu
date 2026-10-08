"use client";

import Link from "next/link";
import { toast } from "sonner";
import { currencyReadOnlyLabel } from "@/core/constants";
import { fromConvexError } from "@/core/errors";
import { useMyProfile } from "@/modules/auth/hooks/use-my-profile";
import { AllocationBar } from "@/modules/onboarding/components/allocation-bar";
import { buttonVariants } from "@/shared/components/ui/button-variants";
import { Skeleton } from "@/shared/components/ui/skeleton";
import { cn } from "@/shared/lib/utils";
import { useUpdateNotificationPreferences } from "../actions";
import {
	SETTINGS_ADJUST_ALLOCATIONS,
	SETTINGS_CHANGE_CYCLE,
	SETTINGS_CURRENCY_LABEL,
	SETTINGS_CYCLE_ALERTS_LABEL,
	SETTINGS_CYCLE_LABEL,
	SETTINGS_CYCLE_PROFILE,
	SETTINGS_CYCLE_START,
	SETTINGS_CYCLE_TYPE,
	SETTINGS_DAILY_SUMMARY_LABEL,
	SETTINGS_LANGUAGE_LABEL,
	SETTINGS_LANGUAGE_VALUE,
	SETTINGS_PERCENTAGES_LABEL,
	SETTINGS_PERCENTAGES_SUM_OK,
	SETTINGS_PREFERENCES_LABEL,
} from "../constants";
import { formatCycleStart, formatCycleType, formatIncomeProfileLabel } from "../lib/cycle-display";
import { SettingsSection } from "./settings-section";
import { SettingsThemeToggle } from "./settings-theme-toggle";
import { SettingsToggle } from "./settings-toggle";

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

export function SettingsSystemSection({ className }: { className?: string }) {
	const profile = useMyProfile();
	const updatePrefs = useUpdateNotificationPreferences();

	if (profile === undefined) {
		return (
			<section className={cn("flex flex-col gap-3.5", className)}>
				<Skeleton className="h-[180px] rounded-xl" />
				<Skeleton className="h-[140px] rounded-xl [animation-delay:150ms]" />
				<Skeleton className="h-[200px] rounded-xl [animation-delay:300ms]" />
			</section>
		);
	}

	if (profile === null) return null;

	const needs = profile.allocationNeeds;
	const wants = profile.allocationWants;
	const savings = profile.allocationSavings;
	const dailyOn = profile.dailySummaryEnabled ?? true;
	const alertsOn = profile.cycleAlertsEnabled ?? true;

	async function patchPref(key: "dailySummaryEnabled" | "cycleAlertsEnabled", value: boolean) {
		try {
			await updatePrefs({ [key]: value });
		} catch (error) {
			toast.error(fromConvexError(error).message);
		}
	}

	return (
		<section className={cn("flex flex-col gap-3.5", className)}>
			<SettingsSection
				title={SETTINGS_PERCENTAGES_LABEL}
				titleAside={
					<span className="text-xs font-semibold text-qp-deep">{SETTINGS_PERCENTAGES_SUM_OK}</span>
				}
			>
				<AllocationBar needs={needs} wants={wants} savings={savings} />
				<div className="mt-4 grid grid-cols-3 gap-2.5">
					{(
						[
							{ label: "Necesidades", pct: needs, dot: "needs" },
							{ label: "Gustos", pct: wants, dot: "wants" },
							{ label: "Ahorro", pct: savings, dot: "savings" },
						] as const
					).map((item) => (
						<div key={item.label} className="rounded-lg bg-surface-warm/40 px-3 py-2.5">
							<div className="mb-1 flex items-center gap-1.5 text-xs text-body-secondary">
								<span className={cn("size-2 rounded-full", envelopeDotClass(item.dot))} />
								{item.label}
							</div>
							<div className="font-serif text-xl text-ink">{item.pct}%</div>
						</div>
					))}
				</div>
				<Link
					href="/settings/allocations"
					className={cn(
						buttonVariants({ variant: "outline", size: "sm" }),
						"mt-3.5 border-line text-body-secondary",
					)}
				>
					{SETTINGS_ADJUST_ALLOCATIONS}
				</Link>
			</SettingsSection>

			<SettingsSection title={SETTINGS_CYCLE_LABEL}>
				<div className="grid grid-cols-1 gap-2.5 sm:grid-cols-3">
					{(
						[
							{ label: SETTINGS_CYCLE_TYPE, value: formatCycleType(profile) },
							{
								label: SETTINGS_CYCLE_START,
								value: formatCycleStart(profile),
							},
							{
								label: SETTINGS_CYCLE_PROFILE,
								value: formatIncomeProfileLabel(profile),
							},
						] as const
					).map((card) => (
						<div key={card.label} className="rounded-lg bg-surface-warm/40 px-3.5 py-3">
							<div className="text-[12.5px] font-medium text-ink-secondary">{card.label}</div>
							<div className="mt-0.5 text-sm font-semibold text-ink">{card.value}</div>
						</div>
					))}
				</div>
				<Link
					href="/settings/cycle"
					className={cn(
						buttonVariants({ variant: "outline", size: "sm" }),
						"mt-3.5 border-line text-body-secondary",
					)}
				>
					{SETTINGS_CHANGE_CYCLE}
				</Link>
			</SettingsSection>

			<SettingsSection id="preferencias" className="scroll-mt-6" title={SETTINGS_PREFERENCES_LABEL}>
				<div className="flex flex-col gap-2">
					<div className="flex items-center justify-between gap-3 rounded-lg bg-surface-warm/40 px-3.5 py-2.5">
						<span className="text-sm text-ink">{SETTINGS_CURRENCY_LABEL}</span>
						<span className="text-[13.5px] text-mute">
							{currencyReadOnlyLabel(profile.currencyCode, profile.currencySymbol)}
						</span>
					</div>
					<div className="flex items-center justify-between gap-3 rounded-lg bg-surface-warm/40 px-3.5 py-2.5">
						<span className="text-sm text-ink">{SETTINGS_LANGUAGE_LABEL}</span>
						<span className="text-[13.5px] text-mute">{SETTINGS_LANGUAGE_VALUE}</span>
					</div>
					<div className="rounded-lg bg-surface-warm/40 px-3.5">
						<SettingsThemeToggle />
					</div>
					<div className="flex items-center justify-between gap-3 rounded-lg bg-surface-warm/40 px-3.5 py-2.5">
						<span className="text-sm text-ink">{SETTINGS_DAILY_SUMMARY_LABEL}</span>
						<SettingsToggle
							label={SETTINGS_DAILY_SUMMARY_LABEL}
							checked={dailyOn}
							onCheckedChange={(v) => void patchPref("dailySummaryEnabled", v)}
						/>
					</div>
					<div className="flex items-center justify-between gap-3 rounded-lg bg-surface-warm/40 px-3.5 py-2.5">
						<span className="text-sm text-ink">{SETTINGS_CYCLE_ALERTS_LABEL}</span>
						<SettingsToggle
							label={SETTINGS_CYCLE_ALERTS_LABEL}
							checked={alertsOn}
							onCheckedChange={(v) => void patchPref("cycleAlertsEnabled", v)}
						/>
					</div>
				</div>
			</SettingsSection>
		</section>
	);
}
