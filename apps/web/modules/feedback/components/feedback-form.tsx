"use client";

import { useForm } from "@tanstack/react-form";
import { usePathname } from "next/navigation";
import { useMemo } from "react";
import { toast } from "sonner";
import { AnalyticsEvents, track } from "@/core/analytics";
import { fromConvexError } from "@/core/errors";
import { Button } from "@/shared/components/ui/button";
import { Field, FieldError, FieldLabel } from "@/shared/components/ui/field";
import { Textarea } from "@/shared/components/ui/textarea";
import { cn } from "@/shared/lib/utils";
import { parseSubmitFeedbackInput, submitFeedback, useSubmitFeedback } from "../actions";
import {
	FEEDBACK_CATEGORY_LABEL,
	FEEDBACK_CATEGORY_OPTIONS,
	FEEDBACK_ERROR,
	FEEDBACK_MESSAGE_LABEL,
	FEEDBACK_MESSAGE_PLACEHOLDER,
	FEEDBACK_SUBMIT,
	FEEDBACK_SUBMITTING,
	FEEDBACK_SUCCESS,
} from "../constants";
import { createFeedbackFormSchema, type FeedbackFormValues } from "../schemas";

const FEEDBACK_FORM_DEFAULT_VALUES: FeedbackFormValues = {
	category: "question",
	message: "",
};

export function FeedbackForm() {
	const pathname = usePathname();
	const submitFeedbackMutation = useSubmitFeedback();
	const formSchema = useMemo(() => createFeedbackFormSchema(), []);

	const form = useForm({
		defaultValues: FEEDBACK_FORM_DEFAULT_VALUES,
		validators: {
			onChange: formSchema,
			onSubmit: formSchema,
		},
		onSubmit: async ({ value }) => {
			try {
				const payload = parseSubmitFeedbackInput({
					category: value.category,
					message: value.message,
					pagePath: pathname || undefined,
					userAgent: typeof navigator !== "undefined" ? navigator.userAgent : undefined,
				});

				await submitFeedback(submitFeedbackMutation, {
					category: payload.category,
					message: payload.message,
					pagePath: payload.pagePath,
					userAgent: payload.userAgent,
				});

				track(AnalyticsEvents.FEEDBACK_SUBMITTED, {
					category: value.category,
					message_length: value.message.trim().length,
					has_page_path: Boolean(pathname),
				});

				toast.success(FEEDBACK_SUCCESS);
				form.reset();
			} catch (error) {
				toast.error(fromConvexError(error).message ?? FEEDBACK_ERROR);
			}
		},
	});

	return (
		<form
			className="space-y-5"
			onSubmit={(event) => {
				event.preventDefault();
				event.stopPropagation();
				void form.handleSubmit();
			}}
		>
			<form.Field name="category">
				{(field) => (
					<Field>
						<FieldLabel>{FEEDBACK_CATEGORY_LABEL}</FieldLabel>
						<div className="mt-2 flex flex-wrap gap-2">
							{FEEDBACK_CATEGORY_OPTIONS.map((option) => {
								const isSelected = field.state.value === option.value;
								return (
									<button
										key={option.value}
										type="button"
										aria-pressed={isSelected}
										className={cn(
											"rounded-full border px-3.5 py-2 text-[13px] font-medium transition-colors",
											isSelected
												? "border-qp-deep bg-qp-soft text-qp-deep"
												: "border-line bg-control text-ink hover:bg-surface-warm",
										)}
										onClick={() => field.handleChange(option.value)}
									>
										{option.label}
									</button>
								);
							})}
						</div>
					</Field>
				)}
			</form.Field>

			<form.Field name="message">
				{(field) => {
					const isInvalid = field.state.meta.isTouched && !field.state.meta.isValid;
					return (
						<Field data-invalid={isInvalid}>
							<FieldLabel htmlFor="feedback-message">{FEEDBACK_MESSAGE_LABEL}</FieldLabel>
							<Textarea
								id="feedback-message"
								name={field.name}
								value={field.state.value}
								onBlur={field.handleBlur}
								onChange={(event) => field.handleChange(event.target.value)}
								placeholder={FEEDBACK_MESSAGE_PLACEHOLDER}
								rows={6}
								maxLength={2000}
								aria-invalid={isInvalid}
							/>
							{isInvalid ? <FieldError errors={field.state.meta.errors} /> : null}
						</Field>
					);
				}}
			</form.Field>

			<form.Subscribe selector={(state) => state.isSubmitting}>
				{(isSubmitting) => (
					<Button type="submit" disabled={isSubmitting} className="w-full">
						{isSubmitting ? FEEDBACK_SUBMITTING : FEEDBACK_SUBMIT}
					</Button>
				)}
			</form.Subscribe>
		</form>
	);
}
