"use client";

import { useForm } from "@tanstack/react-form";
import { useEffect, useRef, useState } from "react";
import { currencySymbolForCode, DEFAULT_CURRENCY } from "@/core/constants";
import { fromConvexError } from "@/core/errors";
import { ExpenseKeypad } from "@/modules/expenses/components/expense-keypad";
import { ENVELOPE_EXPENSE_STYLES, EXPENSE_AMOUNT_LABEL } from "@/modules/expenses/constants";
import type { ExpenseEnvelopeType } from "@/modules/expenses/lib/envelopeSuggestion";
import { formatKeypadDisplay } from "@/modules/expenses/lib/keypad";
import { expenseRegisterSchema } from "@/modules/expenses/schemas";
import { Button } from "@/shared/components/ui/button";
import { Field, FieldError } from "@/shared/components/ui/field";
import { Input } from "@/shared/components/ui/input";
import { ENVELOPE_LABELS } from "@/shared/constants/envelopes";

type UpdateExpenseFn = (args: {
	expenseId: string;
	amount: number;
	description: string;
	envelopeType: ExpenseEnvelopeType;
}) => Promise<unknown>;

type Props = {
	expenseId: string;
	initialAmountCents: number;
	initialDescription: string;
	initialEnvelopeType: ExpenseEnvelopeType;
	currencyCode?: string;
	updateExpense: UpdateExpenseFn;
	onSuccess: () => void;
	onCancel: () => void;
	autoFocus?: boolean;
};

const ENVELOPES: ExpenseEnvelopeType[] = ["needs", "wants"];

export function ExpenseEditForm({
	expenseId,
	initialAmountCents,
	initialDescription,
	initialEnvelopeType,
	currencyCode = DEFAULT_CURRENCY.code,
	updateExpense,
	onSuccess,
	onCancel,
	autoFocus = false,
}: Props) {
	const formRef = useRef<HTMLDivElement>(null);
	const [serverError, setServerError] = useState<string | null>(null);
	const currencySymbol = currencySymbolForCode(currencyCode);

	useEffect(() => {
		if (!autoFocus) return;
		const firstField = formRef.current?.querySelector<HTMLElement>(
			'button[type="button"]:not([disabled])',
		);
		firstField?.focus();
	}, [autoFocus]);

	const form = useForm({
		defaultValues: {
			amountCents: initialAmountCents,
			envelopeType: initialEnvelopeType,
			description: initialDescription,
		},
		validators: {
			onChange: expenseRegisterSchema,
			onSubmit: expenseRegisterSchema,
		},
		onSubmit: async ({ value }) => {
			setServerError(null);
			try {
				await updateExpense({
					expenseId,
					amount: value.amountCents,
					description: value.description.trim(),
					envelopeType: value.envelopeType,
				});
				onSuccess();
			} catch (error) {
				setServerError(fromConvexError(error).message);
			}
		},
	});

	return (
		<div ref={formRef} className="space-y-4">
			<form.Field name="amountCents">
				{(field) => {
					const isInvalid = field.state.meta.isTouched && !field.state.meta.isValid;
					return (
						<Field data-invalid={isInvalid}>
							<div className="text-center">
								<p className="mb-1 font-mono text-[10px] uppercase tracking-widest text-mute">
									{EXPENSE_AMOUNT_LABEL}
								</p>
								<p className="font-serif text-[40px] leading-none text-ink">
									{formatKeypadDisplay(field.state.value, currencySymbol)}
								</p>
							</div>
							<ExpenseKeypad
								amountCents={field.state.value}
								onChange={(cents) => {
									field.handleChange(cents);
									field.handleBlur();
								}}
							/>
							{isInvalid ? (
								<FieldError
									className="mt-2 text-center"
									errors={field.state.meta.errors.map((e) =>
										typeof e === "string" ? { message: e } : e,
									)}
								/>
							) : null}
						</Field>
					);
				}}
			</form.Field>

			<form.Field name="envelopeType">
				{(field) => (
					<div className="space-y-2">
						{ENVELOPES.map((type) => {
							const styles = ENVELOPE_EXPENSE_STYLES[type];
							const isSelected = field.state.value === type;
							return (
								<button
									key={type}
									type="button"
									onClick={() => {
										field.handleChange(type);
										field.handleBlur();
									}}
									className={`w-full rounded-xl border p-4 text-left transition-colors ${
										isSelected
											? `${styles.selectedBorder} ${styles.selectedBg} border-[1.5px]`
											: "border-line/70 bg-card hover:border-line hover:bg-surface-warm/40"
									}`}
								>
									<div className="flex items-center gap-2.5">
										<span className={`size-2.5 rounded-full ${styles.dot}`} aria-hidden />
										<span className="text-[15px] font-semibold text-ink">
											{ENVELOPE_LABELS[type]}
										</span>
									</div>
								</button>
							);
						})}
					</div>
				)}
			</form.Field>

			<form.Field name="description">
				{(field) => (
					<Field>
						<label
							htmlFor="expense-edit-description"
							className="mb-1.5 block text-[12.5px] font-medium text-ink-secondary"
						>
							Concepto <span className="font-normal text-mute">(opcional)</span>
						</label>
						<Input
							id="expense-edit-description"
							name={field.name}
							value={field.state.value}
							onBlur={field.handleBlur}
							onChange={(e) => field.handleChange(e.target.value)}
							placeholder="Concepto (opcional)"
							className="h-[46px] rounded-[11px] border-line bg-card text-[14.5px]"
						/>
					</Field>
				)}
			</form.Field>

			{serverError ? (
				<p className="text-center text-sm text-danger" role="alert">
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
