import { cn } from "@/shared/lib/utils";

/**
 * Banner de estado canon (docs/QUIPU-MASTER.md §3.6).
 * error = terracota sobrio (nunca rojo brillante) · info = acento tranquilo.
 */
export function AuthBanner({
	variant,
	title,
	description,
}: {
	variant: "error" | "info";
	title: string;
	description?: string;
}) {
	const isError = variant === "error";
	return (
		<div
			role="alert"
			className={cn(
				"flex items-start gap-2.75 rounded-xl border px-3.75 py-3.25",
				isError ? "border-danger-banner-line bg-danger-banner" : "border-qp-border bg-qp-selected",
			)}
		>
			<span
				aria-hidden
				className={cn(
					"mt-px flex size-4.5 shrink-0 items-center justify-center rounded-full text-xs font-bold",
					isError ? "bg-danger text-danger-banner" : "bg-qp text-canvas",
				)}
			>
				{isError ? "!" : "i"}
			</span>
			<div>
				<p
					className={cn(
						"text-[13.5px] font-semibold",
						isError ? "text-danger-ink" : "text-qp-deep",
					)}
				>
					{title}
				</p>
				{description && (
					<p className={cn("mt-0.5 text-[12.5px]", isError ? "text-danger-text" : "text-qp-text")}>
						{description}
					</p>
				)}
			</div>
		</div>
	);
}
