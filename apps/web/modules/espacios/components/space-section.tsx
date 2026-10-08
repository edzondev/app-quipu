import type { ReactNode } from "react";
import { cn } from "@/shared/lib/utils";

type Props = {
	title?: string;
	description?: string;
	titleAside?: ReactNode;
	children: ReactNode;
	className?: string;
	contentClassName?: string;
};

export function SpaceSection({
	title,
	description,
	titleAside,
	children,
	className,
	contentClassName,
}: Props) {
	const hasHeader = Boolean(title ?? description ?? titleAside);

	return (
		<section
			className={cn(
				"flex h-full flex-col overflow-hidden rounded-xl border border-line/70 bg-card",
				className,
			)}
		>
			{hasHeader ? (
				<header className="border-b border-line/50 px-4 py-3.5 md:px-5">
					{title || titleAside ? (
						<div className="flex items-center justify-between gap-3">
							{title ? <h2 className="text-sm font-medium text-ink">{title}</h2> : null}
							{titleAside}
						</div>
					) : null}
					{description ? (
						<p className="mt-0.5 text-[13px] leading-relaxed text-mute">{description}</p>
					) : null}
				</header>
			) : null}
			<div className={cn("flex-1 px-4 py-4 md:px-5", contentClassName)}>{children}</div>
		</section>
	);
}
