import type { ComponentProps } from "react";
import { Input } from "@/shared/components/ui/input";
import { cn } from "@/shared/lib/utils";

export function AuthInput({ className, ...props }: ComponentProps<"input">) {
	return (
		<Input
			className={cn(
				"h-12 rounded-[11px] border-line bg-surface-soft px-[15px] text-[15px] text-ink",
				"placeholder:text-faint focus-visible:border-body focus-visible:ring-[3px] focus-visible:ring-qp-selected",
				"aria-invalid:border-danger-line aria-invalid:bg-danger-bg aria-invalid:ring-0",
				className,
			)}
			{...props}
		/>
	);
}
