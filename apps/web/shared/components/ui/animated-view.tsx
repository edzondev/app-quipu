"use client";

import type * as React from "react";
import { useEffect, useRef } from "react";
import { cn } from "@/shared/lib/utils";

export type AnimatedViewDirection = "forward" | "back";

export interface AnimatedViewProps {
	/** Remount trigger — changing this replays the enter animation */
	viewKey: string | number;
	direction?: AnimatedViewDirection;
	/** Announces step changes to screen readers when set */
	"aria-live"?: "polite" | "assertive" | "off";
	/** Associates the animated region with a visible title id */
	"aria-labelledby"?: string;
	/** Move focus to the view container when viewKey changes */
	focusOnMount?: boolean;
	className?: string;
	children: React.ReactNode;
}

const directionClasses: Record<AnimatedViewDirection, string> = {
	forward: "animate-in fade-in-0 slide-in-from-bottom-1.5 duration-200 motion-reduce:animate-none",
	back: "animate-in fade-in-0 slide-in-from-top-1.5 duration-200 motion-reduce:animate-none",
};

export function AnimatedView({
	viewKey,
	direction = "forward",
	"aria-live": ariaLive,
	"aria-labelledby": ariaLabelledBy,
	focusOnMount = false,
	className,
	children,
}: AnimatedViewProps) {
	const ref = useRef<HTMLElement>(null);

	// biome-ignore lint/correctness/useExhaustiveDependencies: viewKey must re-run focus on step change
	useEffect(() => {
		if (focusOnMount) {
			ref.current?.focus({ preventScroll: true });
		}
	}, [viewKey, focusOnMount]);

	return (
		<section
			key={viewKey}
			ref={ref}
			aria-live={ariaLive}
			aria-labelledby={ariaLabelledBy}
			tabIndex={focusOnMount ? -1 : undefined}
			className={cn(directionClasses[direction], className)}
		>
			{children}
		</section>
	);
}
