"use client";

import { Check } from "reicon-react/icons/Check";
import { cn } from "@/shared/lib/utils";

type Props = {
	size?: number;
	className?: string;
	strokeWidth?: number;
};

export function CheckMark({ size = 12, className, strokeWidth = 3 }: Props) {
	return (
		<Check
			size={size}
			strokeWidth={strokeWidth}
			color="currentColor"
			className={cn("text-primary-foreground", className)}
		/>
	);
}
