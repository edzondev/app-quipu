import { ChevronRight } from "reicon-react/icons/ChevronRight";
import { cn } from "@/shared/lib/utils";

export function ListRowChevron({ className }: { className?: string }) {
	return (
		<ChevronRight
			size={16}
			weight="Outline"
			color="currentColor"
			className={cn("shrink-0 text-faint", className)}
			aria-hidden
		/>
	);
}
