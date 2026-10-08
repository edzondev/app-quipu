import type { ReactNode } from "react";
import { AppBreadcrumb } from "@/shared/components/layout/app-breadcrumb";
import type { Crumb } from "@/shared/lib/breadcrumbs";
import { cn } from "@/shared/lib/utils";

const MAX_WIDTH = {
	lg: "max-w-lg",
	"2xl": "max-w-2xl",
	"4xl": "max-w-4xl",
	"6xl": "max-w-6xl",
} as const;

const PADDING: Record<keyof typeof MAX_WIDTH, string> = {
	lg: "px-5 py-6 md:px-0 md:py-8",
	"2xl": "px-5 py-6 md:px-0 md:py-8",
	"4xl": "px-5 py-6 md:px-0 md:py-8",
	"6xl": "px-4 py-6 md:px-8 md:py-8",
};

type Props = {
	children: ReactNode;
	className?: string;
	maxWidth?: keyof typeof MAX_WIDTH;
	breadcrumbs?: "auto" | Crumb[] | false;
	title?: ReactNode;
	subtitle?: ReactNode;
};

export function AppPageShell({
	children,
	className,
	maxWidth = "2xl",
	breadcrumbs = false,
	title,
	subtitle,
}: Props) {
	return (
		<div className={cn("mx-auto w-full", PADDING[maxWidth], MAX_WIDTH[maxWidth], className)}>
			{breadcrumbs !== false ? (
				<AppBreadcrumb items={breadcrumbs === "auto" ? "auto" : breadcrumbs} />
			) : null}
			{title != null || subtitle != null ? (
				<header className="mb-6">
					{title != null ? (
						<h1 className="font-serif text-[26px] font-medium text-ink">{title}</h1>
					) : null}
					{subtitle != null ? <p className="mt-2 text-[13.5px] text-mute">{subtitle}</p> : null}
				</header>
			) : null}
			{children}
		</div>
	);
}
