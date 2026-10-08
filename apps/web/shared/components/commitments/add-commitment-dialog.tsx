"use client";

import { useForm } from "@tanstack/react-form";
import { useMutation } from "convex/react";
import { toast } from "sonner";
import { api } from "@/convex/_generated/api";
import { AnalyticsEvents, track } from "@/core/analytics";
import { fromConvexError } from "@/core/errors";
import { Button } from "@/shared/components/ui/button";
import { Dialog, DialogContent, DialogTitle } from "@/shared/components/ui/dialog";
import { Field, FieldError, FieldLabel } from "@/shared/components/ui/field";
import { Input } from "@/shared/components/ui/input";
import { Sheet, SheetContent, SheetTitle } from "@/shared/components/ui/sheet";
import {
	ADD_COMMITMENT_TITLE,
	COMMITMENT_AMOUNT_LABEL,
	COMMITMENT_CREATED_TOAST,
	COMMITMENT_DUE_LABEL,
	COMMITMENT_ENVELOPE_LABEL,
	COMMITMENT_NAME_LABEL,
	ENVELOPE_LABELS,
} from "@/shared/constants/commitments";
import { useIsMobile } from "@/shared/hooks/use-mobile";
import {
	type AddCommitmentFormValues,
	addCommitmentFormSchema,
	toCreateFixedCommitmentPayload,
} from "./schemas";

type Props = {
	open: boolean;
	onOpenChange: (open: boolean) => void;
};

const defaultValues: AddCommitmentFormValues = {
	name: "",
	amountInput: "",
	dueDayInput: "",
	envelope: "needs",
};

export function AddCommitmentDialog({ open, onOpenChange }: Props) {
	const isMobile = useIsMobile();
	const createCommitment = useMutation(api.fixedCommitments.createFixedCommitment);

	const form = useForm({
		defaultValues,
		validators: {
			onChange: addCommitmentFormSchema,
			onSubmit: addCommitmentFormSchema,
		},
		onSubmit: async ({ value }) => {
			try {
				await createCommitment(toCreateFixedCommitmentPayload(value));
				track(AnalyticsEvents.FIXED_COMMITMENT_CREATED, {
					envelope: value.envelope,
					due_day: Number.parseInt(value.dueDayInput, 10) || 0,
					amount: Number.parseInt(value.amountInput, 10) || 0,
				});
				toast.success(COMMITMENT_CREATED_TOAST);
				form.reset();
				onOpenChange(false);
			} catch (error) {
				toast.error(fromConvexError(error).message);
			}
		},
	});

	function handleOpenChange(nextOpen: boolean) {
		if (!nextOpen) {
			form.reset();
		}
		onOpenChange(nextOpen);
	}

	const formBody = (
		<form
			className="space-y-4"
			onSubmit={(event) => {
				event.preventDefault();
				event.stopPropagation();
				void form.handleSubmit();
			}}
		>
			<form.Field name="name">
				{(field) => {
					const isInvalid = field.state.meta.isTouched && !field.state.meta.isValid;
					return (
						<Field data-invalid={isInvalid}>
							<FieldLabel htmlFor="commitment-name">{COMMITMENT_NAME_LABEL}</FieldLabel>
							<Input
								id="commitment-name"
								name={field.name}
								value={field.state.value}
								onBlur={field.handleBlur}
								onChange={(event) => field.handleChange(event.target.value)}
								maxLength={40}
								autoComplete="off"
								aria-invalid={isInvalid}
							/>
							{isInvalid ? <FieldError errors={field.state.meta.errors} /> : null}
						</Field>
					);
				}}
			</form.Field>

			<form.Field name="amountInput">
				{(field) => {
					const isInvalid = field.state.meta.isTouched && !field.state.meta.isValid;
					return (
						<Field data-invalid={isInvalid}>
							<FieldLabel htmlFor="commitment-amount">{COMMITMENT_AMOUNT_LABEL}</FieldLabel>
							<Input
								id="commitment-amount"
								name={field.name}
								value={field.state.value}
								onBlur={field.handleBlur}
								onChange={(event) => field.handleChange(event.target.value)}
								inputMode="decimal"
								aria-invalid={isInvalid}
							/>
							{isInvalid ? <FieldError errors={field.state.meta.errors} /> : null}
						</Field>
					);
				}}
			</form.Field>

			<form.Field name="dueDayInput">
				{(field) => {
					const isInvalid = field.state.meta.isTouched && !field.state.meta.isValid;
					return (
						<Field data-invalid={isInvalid}>
							<FieldLabel htmlFor="commitment-due">{COMMITMENT_DUE_LABEL}</FieldLabel>
							<Input
								id="commitment-due"
								name={field.name}
								value={field.state.value}
								onBlur={field.handleBlur}
								onChange={(event) => field.handleChange(event.target.value)}
								inputMode="numeric"
								placeholder="1–31"
								aria-invalid={isInvalid}
							/>
							{isInvalid ? <FieldError errors={field.state.meta.errors} /> : null}
						</Field>
					);
				}}
			</form.Field>

			<form.Field name="envelope">
				{(field) => {
					const isInvalid = field.state.meta.isTouched && !field.state.meta.isValid;
					return (
						<Field data-invalid={isInvalid}>
							<span className="text-sm font-medium">{COMMITMENT_ENVELOPE_LABEL}</span>
							<div className="mt-2 flex gap-2">
								{(["needs", "wants"] as const).map((key) => (
									<button
										key={key}
										type="button"
										onClick={() => {
											field.handleChange(key);
											field.handleBlur();
										}}
										className={
											field.state.value === key
												? "rounded-lg border border-qp-border bg-qp-soft px-3 py-1.5 text-sm font-semibold text-qp-deep"
												: "rounded-lg border border-line px-3 py-1.5 text-sm text-mute"
										}
									>
										{ENVELOPE_LABELS[key]}
									</button>
								))}
							</div>
							{isInvalid ? <FieldError errors={field.state.meta.errors} /> : null}
						</Field>
					);
				}}
			</form.Field>

			<form.Subscribe selector={(state) => [state.canSubmit, state.isSubmitting] as const}>
				{([canSubmit, isSubmitting]) => (
					<Button type="submit" disabled={!canSubmit || isSubmitting} className="w-full">
						{isSubmitting ? "Guardando…" : ADD_COMMITMENT_TITLE}
					</Button>
				)}
			</form.Subscribe>
		</form>
	);

	if (isMobile) {
		return (
			<Sheet open={open} onOpenChange={handleOpenChange}>
				<SheetContent
					side="bottom"
					className="flex max-h-[92dvh] flex-col gap-0 overflow-hidden rounded-t-[24px] border-line bg-card px-5 pb-0 pt-3"
				>
					<div className="mx-auto mb-4 h-1 w-10 shrink-0 rounded-full bg-line" />
					<SheetTitle className="mb-4 shrink-0 pr-8 text-[15px] font-semibold text-ink">
						{ADD_COMMITMENT_TITLE}
					</SheetTitle>
					<div className="min-h-0 flex-1 overflow-y-auto overscroll-contain pb-[max(env(safe-area-inset-bottom),20px)]">
						{formBody}
					</div>
				</SheetContent>
			</Sheet>
		);
	}

	return (
		<Dialog open={open} onOpenChange={handleOpenChange}>
			<DialogContent className="max-w-[400px] gap-0 rounded-[22px] p-0">
				<DialogTitle className="px-5 pt-5 text-[15px] font-semibold text-ink">
					{ADD_COMMITMENT_TITLE}
				</DialogTitle>
				<div className="px-5 pb-5 pt-4">{formBody}</div>
			</DialogContent>
		</Dialog>
	);
}
