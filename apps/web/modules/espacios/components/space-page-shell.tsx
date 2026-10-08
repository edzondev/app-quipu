import type { ReactNode } from "react";
import { AppPageShell } from "@/shared/components/layout/app-page-shell";
import type { Crumb } from "@/shared/lib/breadcrumbs";
import { cn } from "@/shared/lib/utils";

type Props = {
	breadcrumbs?: "auto" | Crumb[] | false;
	eyebrow?: string;
	title?: string;
	subtitle?: string;
	children: ReactNode;
	className?: string;
	maxWidth?: "2xl" | "4xl" | "6xl";
};

export function SpacePageShell({
	breadcrumbs = "auto",
	eyebrow,
	title,
	subtitle,
	children,
	className,
	maxWidth = "2xl",
}: Props) {
	return (
		<AppPageShell maxWidth={maxWidth} breadcrumbs={breadcrumbs} className={className}>
			{eyebrow ? (
				<p className="text-[11px] font-medium uppercase tracking-[0.12em] text-faint">{eyebrow}</p>
			) : null}
			{title ? (
				<h1
					className={cn(
						"font-serif text-[26px] font-medium tracking-tight text-ink",
						eyebrow ? "mt-1" : "",
					)}
				>
					{title}
				</h1>
			) : null}
			{subtitle ? (
				<p className="mt-1.5 max-w-prose text-[15px] leading-relaxed text-mute">{subtitle}</p>
			) : null}
			{children}
		</AppPageShell>
	);
}
