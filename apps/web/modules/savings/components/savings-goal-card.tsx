"use client";

import Link from "next/link";
import { Button } from "@/shared/components/ui/button";
import { buttonVariants } from "@/shared/components/ui/button-variants";
import { formatCents } from "@/shared/lib/money";
import { cn } from "@/shared/lib/utils";
import { GOAL_CONTRIBUTE_CTA, GOAL_CONTRIBUTE_DISABLED_HINT, GOAL_PROGRESS_OF } from "../constants";
import type { SavingsGoal } from "../types";

type Props = {
	goal: SavingsGoal;
	currencyCode: string;
	availableToContributeCents: number;
	hasActiveCycle: boolean;
	hasSurplusToMove?: boolean;
	onContribute: () => void;
};

export function SavingsGoalCard({
	goal,
	currencyCode,
	availableToContributeCents,
	hasActiveCycle,
	hasSurplusToMove = false,
	onContribute,
}: Props) {
	const hasTarget = goal.targetAmount !== undefined && goal.targetAmount !== null;
	const currentLabel = formatCents(goal.currentAmount, {
		currency: currencyCode,
	});
	const targetLabel = hasTarget
		? formatCents(goal.targetAmount ?? 0, { currency: currencyCode })
		: null;
	const canContribute = availableToContributeCents > 0;

	return (
		<article className="rounded-xl border border-line/70 bg-card p-3 md:p-[17px]">
			<div className="mb-2 flex items-center justify-between gap-2 md:mb-1 md:block">
				<h3 className="text-[13px] font-semibold text-ink md:text-sm">{goal.label}</h3>
				{hasTarget ? (
					<p className="text-[11.5px] text-mute-subtle md:hidden">
						{currentLabel} / {targetLabel}
					</p>
				) : null}
			</div>
			{hasTarget ? (
				<p className="mb-3 hidden text-xs text-mute-subtle md:block">
					{currentLabel} {GOAL_PROGRESS_OF} {targetLabel}
				</p>
			) : (
				<p className="mb-3 text-xs text-mute-subtle">{currentLabel} · sin meta fija</p>
			)}
			<div className="h-[5px] overflow-hidden rounded-[3px] bg-line-section">
				<div
					className="h-full bg-mute"
					style={{
						width: `${hasTarget ? goal.progressPercent : Math.min(goal.currentAmount > 0 ? 12 : 0, 100)}%`,
					}}
				/>
			</div>
			{/* Canon overview: metas sin CTA permanente. Aportar solo si hay saldo
          libre en el sobre del ciclo; si no, empujar a «Mover al ahorro». */}
			{hasActiveCycle && canContribute ? (
				<Button
					type="button"
					variant="outline"
					size="sm"
					className="mt-3 w-full rounded-[11px]"
					onClick={onContribute}
				>
					{GOAL_CONTRIBUTE_CTA}
				</Button>
			) : null}
			{hasActiveCycle && !canContribute && hasSurplusToMove ? (
				<div className="mt-3">
					<Link
						href={`/savings/move?to=${goal.id}`}
						className={cn(
							buttonVariants({ variant: "outline", size: "sm" }),
							"w-full rounded-[11px]",
						)}
					>
						{GOAL_CONTRIBUTE_CTA}
					</Link>
					<p className="mt-1.5 text-[11px] leading-snug text-faint">
						{GOAL_CONTRIBUTE_DISABLED_HINT}
					</p>
				</div>
			) : null}
		</article>
	);
}
