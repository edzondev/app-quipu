"use client";

import Link from "next/link";
import {
	HERO_EMPTY_CTA,
	INCOME_DESKTOP_CTA,
	INCOME_MOBILE_CTA,
} from "@/modules/dashboard/constants";
import { useDashboardSummary } from "@/modules/dashboard/queries";
import { buttonVariants } from "@/shared/components/ui/button-variants";
import { Skeleton } from "@/shared/components/ui/skeleton";
import { cn } from "@/shared/lib/utils";
import { DashboardRegisterButton } from "./dashboard-register-button";

type Props = {
	layout: "mobile" | "desktop";
};

export function DashboardHeaderActions({ layout }: Props) {
	const summary = useDashboardSummary();
	const isMobile = layout === "mobile";

	if (summary === undefined) {
		return (
			<Skeleton
				className={cn(
					"rounded-[11px] [animation-delay:150ms]",
					isMobile ? "h-10 w-full" : "h-9 w-44",
				)}
			/>
		);
	}

	if (summary === null) {
		return null;
	}

	const hasActiveCycle = Boolean(summary.cycle);

	if (hasActiveCycle) {
		return (
			<div className={cn("flex items-center gap-2", isMobile && "w-full")}>
				<Link
					href="/income/register"
					className={cn(
						buttonVariants({ variant: "secondary", size: "sm" }),
						"border-line bg-card text-mute hover:bg-surface-soft",
						isMobile
							? "min-h-10 flex-1 rounded-[11px] text-[13px] font-semibold"
							: "rounded-[11px] px-4",
					)}
				>
					{isMobile ? INCOME_MOBILE_CTA : INCOME_DESKTOP_CTA}
				</Link>
				<DashboardRegisterButton
					size="sm"
					showLabel
					variant={isMobile ? "secondary" : "primary"}
					className={cn(
						isMobile
							? "min-h-10 flex-1 rounded-[11px] text-[13px] font-semibold"
							: "rounded-[11px] bg-ink px-[18px] text-canvas hover:bg-ink/90",
					)}
				/>
			</div>
		);
	}

	return (
		<Link
			href="/income/register"
			className={cn(
				buttonVariants({ size: "sm" }),
				"rounded-[11px] bg-ink text-canvas hover:bg-ink/90",
				isMobile ? "inline-flex min-h-10 w-full justify-center" : "px-[18px]",
			)}
		>
			{HERO_EMPTY_CTA}
		</Link>
	);
}
