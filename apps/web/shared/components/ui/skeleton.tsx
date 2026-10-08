import { cn } from "@/shared/lib/utils";

/**
 * Canon de estados de carga (quipu-2.html, bloques "Cargando"):
 * pulso `qpulse` 1.4s, bloques en tono `line-soft`, barras de texto
 * en `line-muted`, delays escalonados (0 / 150 / 300ms) vía className.
 */
function Skeleton({
	className,
	variant = "block",
	...props
}: React.ComponentProps<"div"> & { variant?: "block" | "line" }) {
	return (
		<div
			data-slot="skeleton"
			className={cn(
				"animate-qpulse rounded-md",
				variant === "line" ? "bg-line-muted" : "bg-line-soft",
				className,
			)}
			{...props}
		/>
	);
}

export { Skeleton };
