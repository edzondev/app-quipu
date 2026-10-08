import type { ComponentProps } from "react";
import { Button } from "@/shared/components/ui/button";
import { cn } from "@/shared/lib/utils";

type Tone = "neutral" | "danger";

type Props = Omit<ComponentProps<typeof Button>, "variant" | "size"> & {
	tone?: Tone;
};

/** Control de pie de Ajustes: full-width stack, ≥44px de toque. */
export function SettingsAccountActionButton({
	tone = "neutral",
	className,
	type = "button",
	...props
}: Props) {
	return (
		<Button
			type={type}
			variant={tone === "danger" ? "destructive" : "outline"}
			className={cn(
				"h-auto min-h-11 w-full max-w-full justify-start rounded-[11px] px-3.5 py-2.5 text-left text-[13px] font-medium shadow-none whitespace-normal",
				"focus-visible:ring-2 focus-visible:ring-qp-tint/80 focus-visible:ring-offset-2 focus-visible:ring-offset-canvas",
				tone === "neutral" &&
					"border-line bg-control text-ink hover:bg-surface-warm hover:text-ink dark:border-line dark:bg-control dark:hover:bg-surface-warm",
				tone === "danger" &&
					"border border-danger-line bg-danger-bg text-danger-ink hover:bg-danger-banner focus-visible:border-danger/40 focus-visible:ring-danger/30",
				className,
			)}
			{...props}
		/>
	);
}
