"use client";

import { useForm } from "@tanstack/react-form";
import { useEffect, useRef, useState } from "react";
import { AnalyticsEvents, track } from "@/core/analytics";
import { DEFAULT_CURRENCY } from "@/core/constants";
import { fromConvexError } from "@/core/errors";
import { IncomeAmountField } from "@/modules/income/components/income-amount-field";
import { IncomeDatePicker } from "@/modules/income/components/income-date-picker";
import { IncomeSourceChips } from "@/modules/income/components/income-source-chips";
import {
	getIncomeSourceLabel,
	INCOME_CONCEPT_LABEL,
	INCOME_CONCEPT_OPTIONAL,
	INCOME_SOURCE_LABEL,
} from "@/modules/income/constants";
import { buildIncomeDescription } from "@/modules/income/lib/incomeForm";
import type { IncomeSource } from "@/modules/income/types";
import { Button } from "@/shared/components/ui/button";
import { Field, FieldError, FieldLabel } from "@/shared/components/ui/field";
import { Input } from "@/shared/components/ui/input";
import { extractConcept } from "../lib/incomeEditUtils";

type UpdateIncomeEventFn = (args: {
	eventId: string;
	amount: number;
	source: IncomeSource;
	description: string;
	occurredAt: number;
	incomeKind?: "habitual" | "extraordinary";
}) => Promise<unknown>;

type Props = {
	eventId: string;
	initialAmountCents: number;
	initialSource: IncomeSource;
	initialDescription: string;
	initialOccurredAt: number;
	currencyCode?: string;
	updateIncomeEvent: UpdateIncomeEventFn;
	onSuccess: () => void;
	onCancel: () => void;
	autoFocus?: boolean;
};

export function IncomeEditForm({
	eventId,
	initialAmountCents,
	initialSource,
	initialDescription,
	initialOccurredAt,
	currencyCode = DEFAULT_CURRENCY.code,
	updateIncomeEvent,
	onSuccess,
	onCancel,
	autoFocus = false,
}: Props) {
	const formRef = useRef<HTMLDivElement>(null);
	const [serverError, setServerError] = useState<string | null>(null);
	const initialConcept = extractConcept(initialDescription, initialSource);

	useEffect(() => {
		if (!autoFocus) return;
		const amountInput = formRef.current?.querySelector<HTMLInputElement>(
			'input[inputmode="decimal"]',
		);
		amountInput?.focus();
	}, [autoFocus]);

	const form = useForm({
		defaultValues: {
			amountCents: initialAmountCents,
			source: initialSource as IncomeSource | null,
			concept: initialConcept,
			occurredAt: initialOccurredAt,
		},
		onSubmit: async ({ value }) => {
			if (!value.source) return;
			setServerError(null);
			try {
				const description = buildIncomeDescription(
					getIncomeSourceLabel(value.source),
					value.concept,
				);
				await updateIncomeEvent({
					eventId,
					amount: value.amountCents,
					source: value.source,
					description,
					occurredAt: value.occurredAt,
					incomeKind: "habitual",
				});
				track(AnalyticsEvents.INCOME_EVENT_UPDATED, {
					amount: value.amountCents,
					previous_amount: initialAmountCents,
					income_kind: "habitual",
				});
				onSuccess();
			} catch (error) {
				setServerError(fromConvexError(error).message);
			}
		},
	});

	return (
		<div ref={formRef} className="space-y-5">
			<form.Field name="amountCents">
				{(amountField) => {
					const isInvalid =
						amountField.state.meta.isTouched && amountField.state.meta.errors.length > 0;
					return (
						<IncomeAmountField
							amountCents={amountField.state.value}
							onChange={(cents) => amountField.handleChange(cents)}
							onBlur={amountField.handleBlur}
							currencyCode={currencyCode}
							isInvalid={isInvalid}
						/>
					);
				}}
			</form.Field>

			<form.Field name="source">
				{(sourceField) => {
					const isInvalid = sourceField.state.meta.isTouched && !sourceField.state.meta.isValid;
					return (
						<Field data-invalid={isInvalid}>
							<FieldLabel className="mb-2.5 block text-[12.5px] font-medium text-ink-secondary">
								{INCOME_SOURCE_LABEL}
							</FieldLabel>
							<IncomeSourceChips
								value={sourceField.state.value}
								onChange={(source) => {
									sourceField.handleChange(source);
									sourceField.handleBlur();
								}}
							/>
							{isInvalid ? (
								<FieldError
									className="mt-2"
									errors={sourceField.state.meta.errors.map((e) =>
										typeof e === "string" ? { message: e } : e,
									)}
								/>
							) : null}
						</Field>
					);
				}}
			</form.Field>

			<form.Field name="occurredAt">
				{(dateField) => (
					<IncomeDatePicker
						value={dateField.state.value}
						onChange={(ts) => {
							dateField.handleChange(ts);
							dateField.handleBlur();
						}}
					/>
				)}
			</form.Field>

			<form.Field name="concept">
				{(conceptField) => (
					<Field>
						<FieldLabel
							htmlFor="income-edit-concept"
							className="mb-2 block text-[12.5px] font-medium text-ink-secondary"
						>
							{INCOME_CONCEPT_LABEL}{" "}
							<span className="font-normal text-mute">{INCOME_CONCEPT_OPTIONAL}</span>
						</FieldLabel>
						<Input
							id="income-edit-concept"
							name={conceptField.name}
							value={conceptField.state.value}
							onBlur={conceptField.handleBlur}
							onChange={(e) => conceptField.handleChange(e.target.value)}
							placeholder="Ej. pago de cliente"
							className="h-[46px] rounded-[11px] border-line bg-card text-[14.5px]"
						/>
					</Field>
				)}
			</form.Field>

			{serverError ? (
				<p className="text-sm text-danger" role="alert">
					{serverError}
				</p>
			) : null}

			<div className="flex gap-2.5">
				<Button
					type="button"
					variant="outline"
					className="h-12 flex-1 rounded-[12px] border-line text-[14.5px] font-semibold text-mute"
					onClick={onCancel}
				>
					Atrás
				</Button>
				<form.Subscribe selector={(state) => [state.canSubmit, state.isSubmitting] as const}>
					{([canSubmit, isSubmitting]) => (
						<Button
							type="button"
							disabled={!canSubmit || isSubmitting}
							onClick={() => void form.handleSubmit()}
							className="h-12 flex-1 rounded-[12px] bg-ink text-[15px] font-semibold text-canvas hover:bg-ink/90"
						>
							{isSubmitting ? "Guardando…" : "Guardar cambios"}
						</Button>
					)}
				</form.Subscribe>
			</div>
		</div>
	);
}
