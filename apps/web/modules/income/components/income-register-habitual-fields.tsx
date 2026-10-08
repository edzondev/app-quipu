"use client";

import { Field, FieldError, FieldLabel } from "@/shared/components/ui/field";
import { Input } from "@/shared/components/ui/input";
import { INCOME_CONCEPT_LABEL, INCOME_CONCEPT_OPTIONAL, INCOME_SOURCE_LABEL } from "../constants";
import type { IncomeSource } from "../types";
import { IncomeAmountField } from "./income-amount-field";
import { IncomeDatePicker } from "./income-date-picker";
import type { IncomeFormField } from "./income-form-field";
import { IncomeHeldField } from "./income-held-field";
import { IncomeSourceChips } from "./income-source-chips";

type Props = {
	currencyCode: string;
	amountField: IncomeFormField<"amountCents">;
	occurredAtField: IncomeFormField<"occurredAt">;
	sourceField: IncomeFormField<"source">;
	conceptField: IncomeFormField<"concept">;
	heldField: IncomeFormField<"heldCents">;
	suggestedHeldCents?: number;
};

export function IncomeRegisterHabitualFields({
	currencyCode,
	amountField,
	occurredAtField,
	sourceField,
	conceptField,
	heldField,
	suggestedHeldCents,
}: Props) {
	return (
		<>
			<IncomeAmountField
				amountCents={amountField.state.value}
				onChange={(cents) => amountField.handleChange(cents)}
				onBlur={amountField.handleBlur}
				currencyCode={currencyCode}
				variant="habitual"
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

			<Field data-invalid={sourceField.state.meta.isTouched && !sourceField.state.meta.isValid}>
				<FieldLabel className="mb-2.5 block text-[12.5px] font-medium text-ink-secondary">
					{INCOME_SOURCE_LABEL}
				</FieldLabel>
				<IncomeSourceChips
					value={sourceField.state.value}
					onChange={(source: IncomeSource) => {
						sourceField.handleChange(source);
						sourceField.handleBlur();
					}}
				/>
				{sourceField.state.meta.isTouched && !sourceField.state.meta.isValid ? (
					<FieldError className="mt-2" errors={sourceField.state.meta.errors} />
				) : null}
			</Field>

			<IncomeDatePicker
				value={occurredAtField.state.value}
				onChange={(timestamp) => {
					occurredAtField.handleChange(timestamp);
					occurredAtField.handleBlur();
				}}
			/>

			<Field data-invalid={conceptField.state.meta.isTouched && !conceptField.state.meta.isValid}>
				<FieldLabel
					htmlFor="income-concept"
					className="mb-2 block text-[12.5px] font-medium text-ink-secondary"
				>
					{INCOME_CONCEPT_LABEL}{" "}
					<span className="font-normal text-mute">{INCOME_CONCEPT_OPTIONAL}</span>
				</FieldLabel>
				<Input
					id="income-concept"
					name={conceptField.name}
					value={conceptField.state.value}
					onBlur={conceptField.handleBlur}
					onChange={(event) => conceptField.handleChange(event.target.value)}
					placeholder="Ej. pago de cliente"
					aria-invalid={conceptField.state.meta.isTouched && !conceptField.state.meta.isValid}
					className="h-[46px] rounded-[11px] border-line bg-card text-[14.5px]"
				/>
				{conceptField.state.meta.isTouched && !conceptField.state.meta.isValid ? (
					<FieldError errors={conceptField.state.meta.errors} />
				) : null}
			</Field>
		</>
	);
}
