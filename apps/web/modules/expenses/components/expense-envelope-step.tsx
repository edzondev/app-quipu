"use client";

import { Button } from "@/shared/components/ui/button";
import { ENVELOPE_LABELS } from "@/shared/constants/envelopes";
import {
	ENVELOPE_EXPENSE_STYLES,
	EXPENSE_CONFIRM_CTA,
	EXPENSE_ENVELOPE_QUESTION,
	EXPENSE_SUGGESTED_BADGE,
} from "../constants";
import type { ExpenseEnvelopeType } from "../lib/envelopeSuggestion";
import { formatKeypadDisplay } from "../lib/keypad";

const EXPENSE_ENVELOPES = ["needs", "wants"] as const satisfies readonly ExpenseEnvelopeType[];

type Props = {
	amountCents: number;
	currencySymbol: string;
	selectedEnvelope: ExpenseEnvelopeType;
	suggestedEnvelope: ExpenseEnvelopeType;
	hint: string;
	isSubmitting: boolean;
	onSelectEnvelope: (type: ExpenseEnvelopeType) => void;
	onConfirm: () => void;
};

export function ExpenseEnvelopeStep({
	amountCents,
	currencySymbol,
	selectedEnvelope,
	suggestedEnvelope,
	hint,
	isSubmitting,
	onSelectEnvelope,
	onConfirm,
}: Props) {
	return (
		<div className="space-y-4">
			<div className="text-center">
				<span className="inline-block rounded-[10px] bg-surface-warm px-4 py-1 font-serif text-2xl text-ink">
					{formatKeypadDisplay(amountCents, currencySymbol)}
				</span>
			</div>

			<h3 className="text-center font-serif text-[21px] font-medium text-ink">
				{EXPENSE_ENVELOPE_QUESTION}
			</h3>

			<div className="space-y-2">
				{EXPENSE_ENVELOPES.map((type) => {
					const styles = ENVELOPE_EXPENSE_STYLES[type];
					const isSuggested = type === suggestedEnvelope;
					const isSelected = type === selectedEnvelope;

					return (
						<button
							key={type}
							type="button"
							onClick={() => onSelectEnvelope(type)}
							className={`w-full rounded-[14px] border p-4 text-left transition-colors ${
								isSelected
									? `${styles.selectedBorder} ${styles.selectedBg} border-[1.5px]`
									: "border-line bg-card hover:bg-surface-warm"
							}`}
						>
							<div className="flex items-center gap-2.5">
								<span className={`size-2.5 rounded-full ${styles.dot}`} aria-hidden />
								<span className="text-[15px] font-semibold text-ink">{ENVELOPE_LABELS[type]}</span>
								{isSuggested ? (
									<span
										className={`ml-auto rounded-full px-2 py-0.5 text-[10.5px] font-semibold ${styles.badgeBg} ${styles.badgeText}`}
									>
										{EXPENSE_SUGGESTED_BADGE}
									</span>
								) : null}
							</div>
							{isSuggested ? (
								<p className={`mt-1.5 pl-5 text-xs ${styles.hintText}`}>{hint}</p>
							) : null}
						</button>
					);
				})}
			</div>

			<Button
				type="button"
				disabled={isSubmitting}
				onClick={onConfirm}
				className="h-12 w-full rounded-[12px] bg-ink text-[15px] font-semibold text-canvas hover:bg-ink/90"
			>
				{EXPENSE_CONFIRM_CTA} {ENVELOPE_LABELS[selectedEnvelope]}
			</Button>
		</div>
	);
}
