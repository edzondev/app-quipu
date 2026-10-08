import type { ReactNode } from "react";
import { cn } from "@/shared/lib/utils";

const MAX_WIDTH = {
	lg: "max-w-lg",
	"2xl": "max-w-2xl",
	"6xl": "max-w-6xl",
} as const;

type CrossfadeProps = {
	isLoading: boolean;
	skeleton: ReactNode;
	children: ReactNode;
	className?: string;
};

/** Crossfades skeleton → content (150ms). Respects prefers-reduced-motion. */
export function ModuleLoadingCrossfade({
	isLoading,
	skeleton,
	children,
	className,
}: CrossfadeProps) {
	return (
		<div className={cn("relative", className)}>
			<div
				aria-hidden={!isLoading}
				className={cn(
					"transition-opacity duration-150 motion-reduce:transition-none",
					isLoading
						? "relative z-10 opacity-100"
						: "pointer-events-none absolute inset-0 z-0 opacity-0",
				)}
			>
				{skeleton}
			</div>
			<div
				aria-hidden={isLoading}
				className={cn(
					"transition-opacity duration-150 motion-reduce:transition-none",
					isLoading ? "pointer-events-none absolute inset-0 opacity-0" : "relative opacity-100",
				)}
			>
				{children}
			</div>
		</div>
	);
}

type Props = {
	children: ReactNode;
	className?: string;
	maxWidth?: keyof typeof MAX_WIDTH;
	/** With skeleton, crossfades between loading and loaded states. */
	isLoading?: boolean;
	skeleton?: ReactNode;
};

/** Consistent padding shell for module loading skeletons (espacios pattern). */
export function ModuleLoadingShell({
	children,
	className,
	maxWidth = "2xl",
	isLoading,
	skeleton,
}: Props) {
	const shellClass = cn("mx-auto w-full px-5 py-6 md:px-0 md:py-8", MAX_WIDTH[maxWidth], className);

	if (skeleton != null && isLoading !== undefined) {
		return (
			<div className={shellClass}>
				<ModuleLoadingCrossfade isLoading={isLoading} skeleton={skeleton}>
					{children}
				</ModuleLoadingCrossfade>
			</div>
		);
	}

	return <div className={shellClass}>{children}</div>;
}
