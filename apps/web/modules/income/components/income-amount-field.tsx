"use client";

import { useId, useState } from "react";
import { Field, FieldError, FieldLabel } from "@/shared/components/ui/field";
import { formatCents, parseToCents } from "@/shared/lib/money";
import { cn } from "@/shared/lib/utils";
import { INCOME_AMOUNT_LABEL } from "../constants";

type Props = {
	amountCents: number;
	onChange: (cents: number) => void;
	onBlur: () => void;
	currencyCode: string;
	variant?: "habitual" | "extraordinary";
	isInvalid?: boolean;
	errors?: readonly { message?: string }[];
};

export function IncomeAmountField({
	amountCents,
	onChange,
	onBlur,
	currencyCode,
	variant = "habitual",
	isInvalid,
	errors,
}: Props) {
	const inputId = useId();
	const [focused, setFocused] = useState(false);
	const [draft, setDraft] = useState("");

	const formatted = amountCents > 0 ? formatCents(amountCents, { currency: currencyCode }) : "";
	const display = focused ? draft : formatted;

	const commit = () => {
		const trimmed = draft.trim();
		if (!trimmed) {
			onChange(0);
			setDraft("");
		} else {
			const parsed = parseToCents(trimmed);
			if (parsed !== null) {
				onChange(parsed);
				setDraft(formatCents(parsed, { currency: currencyCode }));
			}
		}
		onBlur();
	};

	const isExtraordinary = variant === "extraordinary";

	return (
		<Field data-invalid={isInvalid}>
			<FieldLabel
				htmlFor={inputId}
				className="mb-2 block text-[12.5px] font-medium text-ink-secondary"
			>
				{INCOME_AMOUNT_LABEL}
			</FieldLabel>
			<input
				id={inputId}
				type="text"
				inputMode="decimal"
				autoComplete="off"
				aria-invalid={isInvalid}
				placeholder={formatCents(0, { currency: currencyCode })}
				className={cn(
					"flex h-16 w-full items-center rounded-[14px] px-5 font-serif text-[34px] leading-none text-ink outline-none transition-colors",
					isExtraordinary
						? "border-[1.5px] border-extraordinary-border bg-extraordinary-surface/40 focus:border-extraordinary-a"
						: "border border-line bg-card focus:border-qp",
				)}
				value={display}
				onFocus={() => {
					setDraft(formatted);
					setFocused(true);
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
			{isInvalid && errors?.length ? (
				<FieldError className="mt-2" errors={errors.map((error) => ({ message: error.message }))} />
			) : null}
		</Field>
	);
}
