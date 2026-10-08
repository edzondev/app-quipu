"use client";

import { useForm } from "@tanstack/react-form";
import { useMutation } from "convex/react";
import { useMemo } from "react";
import { toast } from "sonner";
import { api } from "@/convex/_generated/api";
import { AnalyticsEvents, track } from "@/core/analytics";
import { fromConvexError } from "@/core/errors";
import { Button } from "@/shared/components/ui/button";
import { Field, FieldError, FieldLabel } from "@/shared/components/ui/field";
import { Input } from "@/shared/components/ui/input";
import {
	NEW_GOAL_CANCEL,
	NEW_GOAL_LABEL,
	NEW_GOAL_SUBMIT,
	NEW_GOAL_TARGET_LABEL,
	NEW_GOAL_TITLE,
} from "../constants";
import { createNewGoalSchema, type NewGoalFormValues, newGoalFormToMutationArgs } from "../schemas";
import { SavingsFormShell } from "./savings-form-shell";

type Props = {
	open: boolean;
	onOpenChange: (open: boolean) => void;
};

export function NewGoalDialog({ open, onOpenChange }: Props) {
	const createGoal = useMutation(api.savings.createSavingsGoal);
	const formSchema = useMemo(() => createNewGoalSchema(), []);

	const form = useForm({
		defaultValues: {
			label: "",
			targetInput: "",
		} satisfies NewGoalFormValues,
		validators: {
			onChange: formSchema,
			onSubmit: formSchema,
		},
		onSubmit: async ({ value }) => {
			try {
				await createGoal(newGoalFormToMutationArgs(value));
				track(AnalyticsEvents.SAVINGS_GOAL_CREATED, {
					label: value.label,
					has_target: value.targetInput.trim().length > 0,
				});
				toast.success("Meta creada.");
				form.reset();
				onOpenChange(false);
			} catch (error) {
				toast.error(fromConvexError(error).message);
			}
		},
	});

	return (
		<SavingsFormShell open={open} onOpenChange={onOpenChange} title={NEW_GOAL_TITLE}>
			<form
				className="space-y-4"
				onSubmit={(event) => {
					event.preventDefault();
					event.stopPropagation();
					void form.handleSubmit();
				}}
			>
				<form.Field name="label">
					{(field) => {
						const isInvalid = field.state.meta.isTouched && !field.state.meta.isValid;
						return (
							<Field data-invalid={isInvalid}>
								<FieldLabel htmlFor="goal-label">{NEW_GOAL_LABEL}</FieldLabel>
								<Input
									id="goal-label"
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

				<form.Field name="targetInput">
					{(field) => {
						const isInvalid = field.state.meta.isTouched && !field.state.meta.isValid;
						return (
							<Field data-invalid={isInvalid}>
								<FieldLabel htmlFor="goal-target">{NEW_GOAL_TARGET_LABEL}</FieldLabel>
								<Input
									id="goal-target"
									name={field.name}
									value={field.state.value}
									onBlur={field.handleBlur}
									onChange={(event) => field.handleChange(event.target.value)}
									inputMode="decimal"
									placeholder="3000"
									aria-invalid={isInvalid}
								/>
								{isInvalid ? <FieldError errors={field.state.meta.errors} /> : null}
							</Field>
						);
					}}
				</form.Field>

				<div className="flex flex-col gap-2 pt-2">
					<form.Subscribe selector={(state) => [state.canSubmit, state.isSubmitting] as const}>
						{([canSubmit, isSubmitting]) => (
							<Button type="submit" disabled={!canSubmit || isSubmitting}>
								{NEW_GOAL_SUBMIT}
							</Button>
						)}
					</form.Subscribe>
					<Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
						{NEW_GOAL_CANCEL}
					</Button>
				</div>
			</form>
		</SavingsFormShell>
	);
}
