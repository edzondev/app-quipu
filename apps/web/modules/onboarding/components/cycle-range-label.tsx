import { ArrowRight } from "reicon-react/icons/ArrowRight";
import { cn } from "@/shared/lib/utils";
import type { FormattedCycle } from "../lib/cycle";

type Props = {
	cycle: FormattedCycle;
	className?: string;
};

export function CycleRangeLabel({ cycle, className }: Props) {
	if (cycle.kind === "text") {
		return <span className={className}>{cycle.value}</span>;
	}

	return (
		<span className={cn("inline-flex items-center gap-1.5", className)}>
			{cycle.start}
			<ArrowRight size={14} color="currentColor" aria-hidden />
			{cycle.end}
		</span>
	);
}
