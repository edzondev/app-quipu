"use client";

import { useState } from "react";
import { Field, FieldError, FieldLabel } from "@/shared/components/ui/field";
import { formatCents, parseToCents } from "@/shared/lib/money";
import { cn } from "@/shared/lib/utils";
import {
	INCOME_HELD_HINT,
	INCOME_HELD_LABEL,
	INCOME_HELD_OPTIONAL,
	INCOME_HELD_SUGGESTED,
} from "../constants";
import type { IncomeFormField } from "./income-form-field";

type Props = {
	currencyCode: string;
	heldField: IncomeFormField<"heldCents">;
	amountCents: number;
	/** Suggested value from uncovered commitments (in cents). */
	suggestedHeldCents?: number;
};

export function IncomeHeldField({
	currencyCode,
	heldField,
	amountCents,
	suggestedHeldCents,
}: Props) {
	const [focused, setFocused] = useState(false);
	const [draft, setDraft] = useState("");
	const currentValue = heldField.state.value ?? 0;
	const formattedValue =
		currentValue > 0 ? formatCents(currentValue, { currency: currencyCode }) : "";
	// Derive when idle; only use local draft while the user is typing.
	const displayValue = focused ? draft : formattedValue;

	const commit = () => {
		const trimmed = draft.trim();
		if (!trimmed) {
			heldField.handleChange(0);
			setDraft("");
		} else {
			const parsed = parseToCents(trimmed);
			if (parsed !== null) {
				const clamped = Math.max(0, Math.min(parsed, amountCents));
				heldField.handleChange(clamped);
				setDraft(formatCents(clamped, { currency: currencyCode }));
			}
		}
		heldField.handleBlur();
	};

	const applySuggestion = () => {
		if (!suggestedHeldCents || suggestedHeldCents <= 0) return;
		heldField.handleChange(suggestedHeldCents);
		setDraft(formatCents(suggestedHeldCents, { currency: currencyCode }));
		heldField.handleBlur();
	};

	const isInvalid = heldField.state.meta.isTouched && !heldField.state.meta.isValid;
	const showSuggestion =
		suggestedHeldCents !== undefined &&
		suggestedHeldCents > 0 &&
		currentValue !== suggestedHeldCents &&
		amountCents > 0;

	return (
		<Field data-invalid={isInvalid}>
			<div className="mb-2 flex items-center justify-between gap-2">
				<FieldLabel
					htmlFor="income-held"
					className="block text-[12.5px] font-medium text-ink-secondary"
				>
					{INCOME_HELD_LABEL} <span className="font-normal text-mute">{INCOME_HELD_OPTIONAL}</span>
				</FieldLabel>
				{showSuggestion ? (
					<button
						type="button"
						onClick={applySuggestion}
						className="rounded-md px-2 py-0.5 text-[11px] font-medium text-qp-deep underline-offset-2 hover:underline focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-qp"
					>
						{INCOME_HELD_SUGGESTED}: {formatCents(suggestedHeldCents, { currency: currencyCode })}
					</button>
				) : null}
			</div>
			<input
				id="income-held"
				type="text"
				inputMode="decimal"
				autoComplete="off"
				aria-invalid={isInvalid}
				placeholder={formatCents(0, { currency: currencyCode })}
				className={cn(
					"flex h-[46px] w-full items-center rounded-[11px] border px-4 text-[14.5px] text-ink outline-none transition-colors",
					isInvalid
						? "border-[1.5px] border-danger bg-danger-bg focus:border-danger"
						: "border-line bg-card focus:border-qp focus:ring-[3px] focus:ring-qp/20",
				)}
				value={displayValue}
				onFocus={() => {
					setFocused(true);
					setDraft(formattedValue);
				}}
				onChange={(event) => setDraft(event.target.value)}
				onBlur={() => {
					setFocused(false);
					commit();
				}}
				onKeyDown={(event) => {
					if (event.key === "Enter") {
						event.preventDefault();
						event.currentTarget.blur();
					}
				}}
			/>
			<p className="mt-1.5 text-[11.5px] text-mute">{INCOME_HELD_HINT}</p>
			{isInvalid ? (
				<FieldError
					className="mt-1"
					errors={heldField.state.meta.errors.filter((e): e is { message?: string } => e != null)}
				/>
			) : null}
		</Field>
	);
}
