import Link from "next/link";
import type { ComponentProps } from "react";
import { ChevronRight } from "reicon-react/icons/ChevronRight";
import { cn } from "@/shared/lib/utils";

type Props = ComponentProps<typeof Link> & {
	children: React.ReactNode;
	/** Section header CTAs (Ver todo): chevron + 44px touch target on mobile. */
	variant?: "header" | "inline";
};

export function SectionLink({ children, className, variant = "header", ...props }: Props) {
	const isHeader = variant === "header";

	return (
		<Link
			{...props}
			className={cn(
				"inline-flex shrink-0 items-center text-sm font-medium underline-offset-2 transition-colors",
				isHeader
					? "min-h-11 gap-0.5 text-ink-secondary hover:text-qp-deep hover:underline md:min-h-0"
					: "text-qp-deep hover:underline",
				className,
			)}
		>
			{children}
			{isHeader ? (
				<ChevronRight size={14} color="currentColor" aria-hidden className="shrink-0" />
			) : null}
		</Link>
	);
}
