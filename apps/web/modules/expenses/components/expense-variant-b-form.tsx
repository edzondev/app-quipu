"use client";

import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";
import { ENVELOPE_LABELS } from "@/shared/constants/envelopes";
import {
	ENVELOPE_EXPENSE_STYLES,
	EXPENSE_AMOUNT_LABEL,
	EXPENSE_CONCEPT_LABEL,
	EXPENSE_CONCEPT_OPTIONAL,
	EXPENSE_PRESELECTED_SUFFIX,
	EXPENSE_REGISTER_CTA,
} from "../constants";
import type { ExpenseEnvelopeType } from "../lib/envelopeSuggestion";
import { formatKeypadDisplay } from "../lib/keypad";
import { ExpenseKeypad } from "./expense-keypad";

type Props = {
	envelopeType: ExpenseEnvelopeType;
	amountCents: number;
	description: string;
	currencySymbol: string;
	isSubmitting: boolean;
	onAmountChange: (cents: number) => void;
	onDescriptionChange: (value: string) => void;
	onSubmit: () => void;
};

export function ExpenseVariantBForm({
	envelopeType,
	amountCents,
	description,
	currencySymbol,
	isSubmitting,
	onAmountChange,
	onDescriptionChange,
	onSubmit,
}: Props) {
	const styles = ENVELOPE_EXPENSE_STYLES[envelopeType];

	return (
		<div className="space-y-4">
			<div
				className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 ${styles.pillBg} ${styles.pillBorder}`}
			>
				<span className={`size-2 rounded-full ${styles.dot}`} aria-hidden />
				<span className={`text-[12.5px] font-semibold ${styles.pillText}`}>
					{ENVELOPE_LABELS[envelopeType]}
				</span>
				<span className="text-[11px] text-mute">{EXPENSE_PRESELECTED_SUFFIX}</span>
			</div>

			<div>
				<p className="mb-2 text-[12.5px] font-medium text-ink-secondary">{EXPENSE_AMOUNT_LABEL}</p>
				<div className="rounded-[12px] border border-line bg-surface-soft px-4 py-3 text-center font-serif text-[22px] text-ink">
					{formatKeypadDisplay(amountCents, currencySymbol)}
				</div>
				<ExpenseKeypad amountCents={amountCents} onChange={onAmountChange} className="mt-3" />
			</div>

			<div>
				<label
					htmlFor="expense-concept"
					className="mb-2 block text-[12.5px] font-medium text-ink-secondary"
				>
					{EXPENSE_CONCEPT_LABEL}{" "}
					<span className="font-normal text-mute">{EXPENSE_CONCEPT_OPTIONAL}</span>
				</label>
				<Input
					id="expense-concept"
					value={description}
					onChange={(event) => onDescriptionChange(event.target.value)}
					placeholder="Recibo de luz"
					className="h-[46px] rounded-[12px] border-line bg-surface-soft text-[14.5px]"
				/>
			</div>

			<Button
				type="button"
				disabled={isSubmitting}
				onClick={onSubmit}
				className="h-12 w-full rounded-[12px] bg-ink text-[15px] font-semibold text-canvas hover:bg-ink/90"
			>
				{EXPENSE_REGISTER_CTA}
			</Button>
		</div>
	);
}
