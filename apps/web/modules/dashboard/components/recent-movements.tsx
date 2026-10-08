import Link from "next/link";
import { BillList } from "reicon-react/icons/BillList";
import { MovementList } from "@/shared/components/movements/movement-list";
import { buttonVariants } from "@/shared/components/ui/button-variants";
import { SectionLink } from "@/shared/components/ui/section-link";
import { cn } from "@/shared/lib/utils";
import { MOVEMENTS_EMPTY_BODY, MOVEMENTS_SECTION_LABEL, MOVEMENTS_VIEW_ALL } from "../constants";
import type { DashboardMovement } from "../types";

type Props = {
	movements: DashboardMovement[];
	currencyCode: string;
	isEarlyCycle?: boolean;
};

function MovementsEmptyState() {
	return (
		<div className="flex flex-col items-center justify-center px-3 py-6 text-center md:px-6 md:py-10">
			<span
				className="mb-3 flex size-10 items-center justify-center rounded-full border border-dashed border-line bg-surface-warm text-mute"
				aria-hidden
			>
				<BillList size={20} color="currentColor" />
			</span>
			<p className="max-w-sm text-sm leading-relaxed text-mute">{MOVEMENTS_EMPTY_BODY}</p>
			<Link
				href="/movements"
				className={cn(
					buttonVariants({ variant: "outline" }),
					"mt-4 rounded-[11px] border-line px-4 text-ink-secondary",
				)}
			>
				{MOVEMENTS_VIEW_ALL}
			</Link>
		</div>
	);
}

export function RecentMovements({ movements, currencyCode, isEarlyCycle = false }: Props) {
	const showEmptyState = isEarlyCycle || movements.length === 0;

	return (
		<section aria-labelledby="dashboard-movements">
			<div className="mb-1.5 flex items-center gap-2 md:mb-2">
				<h2
					id="dashboard-movements"
					className="font-mono text-[10.5px] uppercase tracking-[0.1em] text-mute"
				>
					{MOVEMENTS_SECTION_LABEL}
				</h2>
				<div className="h-px flex-1 bg-line-divider" />
				<SectionLink href="/movements">{MOVEMENTS_VIEW_ALL}</SectionLink>
			</div>

			{showEmptyState ? (
				<div
					className={cn("overflow-hidden rounded-[14px] border border-dashed border-line bg-card")}
				>
					<MovementsEmptyState />
				</div>
			) : (
				<Link
					href="/movements"
					className="block overflow-hidden rounded-[14px] border border-line bg-card transition-colors hover:border-line/90 hover:bg-surface-warm/20"
				>
					<MovementList movements={movements} currencyCode={currencyCode} />
				</Link>
			)}
		</section>
	);
}
