import { formatLimaDateTime } from "@/shared/lib/date";
import { formatCents } from "@/shared/lib/money";
import {
	movementAmountClassName,
	movementAmountPrefix,
} from "@/shared/lib/movement-amount-display";

export type MovementItem = {
	id: string;
	kind: "expense" | "income";
	label: string;
	envelopeLabel?: string;
	amount: number;
	timestamp: number;
	isExtraordinaryIncome?: boolean;
	appliedByAutoRule?: boolean;
};

const MOVEMENT_DOT = {
	expense: {
		needs: "bg-steel",
		wants: "bg-clay",
		default: "bg-mute",
	},
	income: "bg-qp",
} as const;

function movementDotClass(movement: MovementItem): string {
	if (movement.kind === "income") {
		return movement.isExtraordinaryIncome ? "bg-extraordinary-a" : MOVEMENT_DOT.income;
	}
	if (movement.envelopeLabel === "Necesidades") return MOVEMENT_DOT.expense.needs;
	if (movement.envelopeLabel === "Gustos") return MOVEMENT_DOT.expense.wants;
	return MOVEMENT_DOT.expense.default;
}

type Props = {
	movements: MovementItem[];
	currencyCode: string;
};

export function MovementList({ movements, currencyCode }: Props) {
	return (
		<ul>
			{movements.map((movement, index) => (
				<li
					key={movement.id}
					className={`flex items-center gap-3 px-3 py-2.5 md:px-[18px] md:py-3 ${
						index < movements.length - 1 ? "border-b border-line-divider" : ""
					}`}
				>
					<span
						className={`size-2 shrink-0 rounded-full ${movementDotClass(movement)}`}
						aria-hidden
					/>
					<div className="min-w-0 flex-1">
						<span className="text-[13.5px] font-semibold text-ink">
							{movement.kind === "income" ? "Ingreso · " : ""}
							{movement.label}
						</span>
						{movement.isExtraordinaryIncome ? (
							<span className="ml-1.5 inline-flex rounded-full border border-extraordinary-border bg-extraordinary-surface px-1.5 py-0.5 text-[10px] font-semibold text-extraordinary-b">
								Extraordinario
							</span>
						) : null}
						{movement.appliedByAutoRule ? (
							<span className="ml-1.5 inline-flex rounded-full border border-qp-border bg-qp-soft px-1.5 py-0.5 text-[10px] font-semibold text-qp-deep">
								auto
							</span>
						) : null}
						{movement.envelopeLabel ? (
							<span className="text-xs text-mute"> · {movement.envelopeLabel}</span>
						) : null}
					</div>
					<span className="hidden text-xs text-mute sm:inline">
						{formatLimaDateTime(movement.timestamp)}
					</span>
					<span
						className={`min-w-20 text-right font-serif text-[15px] ${movementAmountClassName(movement.kind)}`}
					>
						{movementAmountPrefix(movement.kind)}{" "}
						{formatCents(movement.amount, { currency: currencyCode })}
					</span>
				</li>
			))}
		</ul>
	);
}
