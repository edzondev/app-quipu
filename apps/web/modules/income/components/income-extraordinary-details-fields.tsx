"use client";

import { Field, FieldError, FieldLabel } from "@/shared/components/ui/field";
import { Input } from "@/shared/components/ui/input";
import type { ExtraordinaryType } from "@/shared/lib/extraordinaryIncome";
import {
	extraordinaryTypeDisplayTitle,
	INCOME_EXTRAORDINARY_BADGE,
	INCOME_EXTRAORDINARY_CUSTOM_LABEL,
	INCOME_EXTRAORDINARY_DETAILS_SUBTITLE,
} from "../constants";
import { IncomeAmountField } from "./income-amount-field";
import { IncomeDatePicker } from "./income-date-picker";
import type { IncomeFormField } from "./income-form-field";
import { IncomeHeldField } from "./income-held-field";

type Props = {
	currencyCode: string;
	extraordinaryType: ExtraordinaryType;
	amountField: IncomeFormField<"amountCents">;
	occurredAtField: IncomeFormField<"occurredAt">;
	labelField: IncomeFormField<"extraordinaryLabel">;
	heldField: IncomeFormField<"heldCents">;
	suggestedHeldCents?: number;
};

export function IncomeExtraordinaryDetailsFields({
	currencyCode,
	extraordinaryType,
	amountField,
	occurredAtField,
	labelField,
	heldField,
	suggestedHeldCents,
}: Props) {
	const title = extraordinaryTypeDisplayTitle(extraordinaryType);

	return (
		<div className="space-y-5">
			<div className="flex flex-wrap items-center gap-3">
				<h2 className="font-serif text-[27px] font-medium text-ink">{title}</h2>
				<span className="inline-flex items-center gap-1.5 rounded-full border border-extraordinary-border bg-extraordinary-surface px-2.5 py-1 text-[11px] font-semibold text-extraordinary-b">
					<span className="size-1.5 rotate-45 rounded-sm bg-extraordinary-a" aria-hidden />
					{INCOME_EXTRAORDINARY_BADGE}
				</span>
			</div>
			<p className="text-[13.5px] text-mute">{INCOME_EXTRAORDINARY_DETAILS_SUBTITLE}</p>

			<IncomeAmountField
				amountCents={amountField.state.value}
				onChange={(cents) => amountField.handleChange(cents)}
				onBlur={amountField.handleBlur}
				currencyCode={currencyCode}
				variant="extraordinary"
				isInvalid={amountField.state.meta.isTouched && !amountField.state.meta.isValid}
				errors={amountField.state.meta.errors.filter(
					(error): error is { message?: string } => error != null,
				)}
			/>

			<IncomeHeldField
				currencyCode={currencyCode}
				heldField={heldField}
				amountCents={amountField.state.value}
				suggestedHeldCents={suggestedHeldCents}
			/>

			<IncomeDatePicker
				value={occurredAtField.state.value}
				onChange={(timestamp) => {
					occurredAtField.handleChange(timestamp);
					occurredAtField.handleBlur();
				}}
			/>

			{extraordinaryType === "custom" ? (
				<Field data-invalid={labelField.state.meta.isTouched && !labelField.state.meta.isValid}>
					<FieldLabel
						htmlFor="extraordinary-label"
						className="mb-2 block text-[12.5px] font-medium text-ink-secondary"
					>
						{INCOME_EXTRAORDINARY_CUSTOM_LABEL}
					</FieldLabel>
					<Input
						id="extraordinary-label"
						value={labelField.state.value ?? ""}
						onBlur={labelField.handleBlur}
						onChange={(event) => labelField.handleChange(event.target.value)}
						placeholder="Ej. bono por meta anual"
						className="h-[46px] rounded-[11px] border-line bg-card text-[14.5px]"
					/>
					{labelField.state.meta.isTouched && !labelField.state.meta.isValid ? (
						<FieldError errors={labelField.state.meta.errors} />
					) : null}
				</Field>
			) : null}
		</div>
	);
}
