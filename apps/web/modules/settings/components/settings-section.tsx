import type { ReactNode } from "react";
import { cn } from "@/shared/lib/utils";

type Props = {
	title?: string;
	description?: string;
	titleAside?: ReactNode;
	children: ReactNode;
	className?: string;
	contentClassName?: string;
	id?: string;
};

/** Card section aligned with espacios `SpaceSection` — minimal header + body. */
export function SettingsSection({
	title,
	description,
	titleAside,
	children,
	className,
	contentClassName,
	id,
}: Props) {
	const hasHeader = Boolean(title ?? description ?? titleAside);

	return (
		<section
			id={id}
			className={cn("overflow-hidden rounded-xl border border-line/70 bg-card", className)}
		>
			{hasHeader ? (
				<header className="flex items-center justify-between gap-3 border-b border-line/50 px-4 py-3.5 md:px-5">
					<div className="min-w-0">
						{title ? (
							<h2 className="text-[12.5px] font-medium text-ink-secondary">{title}</h2>
						) : null}
						{description ? (
							<p className="mt-0.5 text-[13px] leading-relaxed text-mute">{description}</p>
						) : null}
					</div>
					{titleAside}
				</header>
			) : null}
			<div className={cn("px-4 py-4 md:px-5", contentClassName)}>{children}</div>
		</section>
	);
}
