"use client";

import { AppPageShell } from "@/shared/components/layout/app-page-shell";
import { buttonVariants } from "@/shared/components/ui/button-variants";
import { Skeleton } from "@/shared/components/ui/skeleton";
import { cn } from "@/shared/lib/utils";
import {
	SETTINGS_ERROR_BODY,
	SETTINGS_ERROR_RETRY,
	SETTINGS_ERROR_TITLE,
	SETTINGS_SYSTEM_HEADING,
	SETTINGS_SYSTEM_PAGE_SUBTITLE,
} from "../constants";
import { useSettingsOverview } from "../queries";
import { SettingsCommitmentsSection } from "./settings-commitments-section";
import { SettingsExtraordinarySection } from "./settings-extraordinary-section";
import { SettingsSystemSection } from "./settings-system-section";

export function SettingsSystemViewSkeleton() {
	return (
		<AppPageShell maxWidth="6xl" breadcrumbs="auto">
			<div role="status" aria-label="Abriendo tu sistema">
				<Skeleton className="h-[28px] w-[160px] rounded-lg" />
				<Skeleton variant="line" className="mt-2 h-[13px] w-[240px] max-w-full rounded-[5px]" />
				<div className="mt-6 grid grid-cols-1 gap-3.5 lg:grid-cols-[1.15fr_1fr] lg:items-start lg:gap-4">
					<Skeleton className="h-[180px] rounded-xl" />
					<Skeleton className="h-[280px] rounded-xl [animation-delay:150ms]" />
				</div>
			</div>
		</AppPageShell>
	);
}

export function SettingsSystemView() {
	const settingsData = useSettingsOverview();

	if (settingsData === undefined) {
		return <SettingsSystemViewSkeleton />;
	}

	if (settingsData === null) {
		return (
			<AppPageShell maxWidth="6xl" breadcrumbs="auto">
				<section className="rounded-[14px] border border-danger-line bg-danger-bg p-5 md:p-6">
					<h2 className="text-base font-semibold text-danger-ink">{SETTINGS_ERROR_TITLE}</h2>
					<p className="mt-2 text-sm text-danger-text">{SETTINGS_ERROR_BODY}</p>
					<button
						type="button"
						className={cn(
							buttonVariants({ variant: "outline" }),
							"mt-4 border-danger-line text-danger-ink hover:bg-danger-banner",
						)}
						onClick={() => window.location.reload()}
					>
						{SETTINGS_ERROR_RETRY}
					</button>
				</section>
			</AppPageShell>
		);
	}

	return (
		<AppPageShell maxWidth="6xl" breadcrumbs="auto">
			<header className="mb-5 md:mb-6">
				<h1 className="font-serif text-[23px] font-medium text-ink md:text-2xl">
					{SETTINGS_SYSTEM_HEADING}
				</h1>
				<p className="mt-1 text-[12.5px] text-mute-subtle md:text-[13.5px]">
					{SETTINGS_SYSTEM_PAGE_SUBTITLE}
				</p>
			</header>

			<div className="grid grid-cols-1 gap-3.5 lg:grid-cols-[1.15fr_1fr] lg:items-start lg:gap-4">
				<SettingsSystemSection />
				<SettingsCommitmentsSection id="compromisos" />
			</div>

			<section id="automatizaciones" className="mt-3.5 scroll-mt-6 md:mt-4">
				<SettingsExtraordinarySection />
			</section>
		</AppPageShell>
	);
}
