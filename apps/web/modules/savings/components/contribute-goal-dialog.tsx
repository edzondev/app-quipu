"use client";

import { useForm } from "@tanstack/react-form";
import { useMemo } from "react";
import { toast } from "sonner";
import type { Id } from "@/convex/_generated/dataModel";
import { fromConvexError } from "@/core/errors";
import { Button } from "@/shared/components/ui/button";
import { Field, FieldError, FieldLabel } from "@/shared/components/ui/field";
import { Input } from "@/shared/components/ui/input";
import { formatCents } from "@/shared/lib/money";
import { contributeToSubEnvelope, useContributeToSubEnvelope } from "../actions";
import {
	CONTRIBUTE_NO_FUNDS,
	GOAL_CONTRIBUTE_AMOUNT_LABEL,
	GOAL_CONTRIBUTE_AVAILABLE_PREFIX,
	GOAL_CONTRIBUTE_CANCEL,
	GOAL_CONTRIBUTE_DIALOG_TITLE,
	GOAL_CONTRIBUTE_SUBMIT,
	GOAL_CONTRIBUTE_SUCCESS_PREFIX,
	GOAL_CONTRIBUTE_USE_ALL_CTA,
} from "../constants";
import {
	type ContributeToSubEnvelopeFormValues,
	contributeToSubEnvelopeFormToMutationArgs,
	createContributeToSubEnvelopeSchema,
} from "../schemas";
import { SavingsFormShell } from "./savings-form-shell";

type Props = {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	goalId: Id<"subEnvelopes">;
	goalLabel: string;
	availableCents: number;
	currencyCode: string;
};

export function ContributeGoalDialog({
	open,
	onOpenChange,
	goalId,
	goalLabel,
	availableCents,
	currencyCode,
}: Props) {
	const contributeMutation = useContributeToSubEnvelope();
	const formSchema = useMemo(
		() => createContributeToSubEnvelopeSchema(availableCents),
		[availableCents],
	);

	const form = useForm({
		defaultValues: {
			amountInput: "",
		} satisfies ContributeToSubEnvelopeFormValues,
		validators: {
			onChange: formSchema,
			onSubmit: formSchema,
		},
		onSubmit: async ({ value }) => {
			if (availableCents <= 0) {
				toast.message(CONTRIBUTE_NO_FUNDS);
				return;
			}
			try {
				const args = contributeToSubEnvelopeFormToMutationArgs(goalId, value, availableCents);
				const result = await contributeToSubEnvelope(contributeMutation, args);
				toast.success(
					`${GOAL_CONTRIBUTE_SUCCESS_PREFIX} Moviste ${formatCents(result.amount, {
						currency: currencyCode,
					})} a «${goalLabel}».`,
				);
				form.reset();
				onOpenChange(false);
			} catch (error) {
				toast.error(fromConvexError(error).message);
			}
		},
	});

	return (
		<SavingsFormShell open={open} onOpenChange={onOpenChange} title={GOAL_CONTRIBUTE_DIALOG_TITLE}>
			<p className="mb-4 text-sm text-mute">
				{goalLabel} · {GOAL_CONTRIBUTE_AVAILABLE_PREFIX}{" "}
				{formatCents(availableCents, { currency: currencyCode })}
			</p>
			<form
				className="space-y-4"
				onSubmit={(event) => {
					event.preventDefault();
					event.stopPropagation();
					void form.handleSubmit();
				}}
			>
				<form.Field name="amountInput">
					{(field) => {
						const isInvalid = field.state.meta.isTouched && !field.state.meta.isValid;
						return (
							<Field data-invalid={isInvalid}>
								<FieldLabel htmlFor="goal-contribute-amount">
									{GOAL_CONTRIBUTE_AMOUNT_LABEL}
								</FieldLabel>
								<div className="flex gap-2">
									<Input
										id="goal-contribute-amount"
										name={field.name}
										value={field.state.value}
										onBlur={field.handleBlur}
										onChange={(event) => field.handleChange(event.target.value)}
										inputMode="decimal"
										placeholder="Todo el disponible si lo dejas vacío"
										aria-invalid={isInvalid}
										disabled={availableCents <= 0}
									/>
									<Button
										type="button"
										variant="outline"
										className="shrink-0"
										disabled={availableCents <= 0}
										onClick={() => field.handleChange(String(availableCents / 100))}
									>
										{GOAL_CONTRIBUTE_USE_ALL_CTA}
									</Button>
								</div>
								{isInvalid ? <FieldError errors={field.state.meta.errors} /> : null}
							</Field>
						);
					}}
				</form.Field>

				<div className="flex flex-col gap-2 pt-2">
					<form.Subscribe selector={(state) => [state.canSubmit, state.isSubmitting] as const}>
						{([canSubmit, isSubmitting]) => (
							<Button type="submit" disabled={!canSubmit || isSubmitting || availableCents <= 0}>
								{GOAL_CONTRIBUTE_SUBMIT}
							</Button>
						)}
					</form.Subscribe>
					<Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
						{GOAL_CONTRIBUTE_CANCEL}
					</Button>
				</div>
			</form>
		</SavingsFormShell>
	);
}
