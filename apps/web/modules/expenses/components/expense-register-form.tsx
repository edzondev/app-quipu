"use client";

import { useForm } from "@tanstack/react-form";
import { useState } from "react";
import { ArrowRight } from "reicon-react/icons/ArrowRight";
import { AnalyticsEvents, track } from "@/core/analytics";
import { fromConvexError } from "@/core/errors";
import { AnimatedView } from "@/shared/components/ui/animated-view";
import { Button } from "@/shared/components/ui/button";
import { Field, FieldError } from "@/shared/components/ui/field";
import { EXPENSE_AMOUNT_LABEL, EXPENSE_NEXT_CTA } from "../constants";
import {
  type ExpenseEnvelopeType,
  suggestEnvelope,
} from "../lib/envelopeSuggestion";
import { formatKeypadDisplay } from "../lib/keypad";
import {
  type ExpenseRegisterFormValues,
  expenseRegisterSchema,
} from "../schemas";
import type {
  ExpenseFlowStep,
  ExpenseRegisterResult,
  ExpenseRegisterVariant,
} from "../types";
import { ExpenseEnvelopeStep } from "./expense-envelope-step";
import { ExpenseKeypad } from "./expense-keypad";
import { ExpenseVariantBForm } from "./expense-variant-b-form";

type RegisterExpenseFn = (args: {
  amount: number;
  description: string;
  envelopeType: ExpenseEnvelopeType;
}) => Promise<ExpenseRegisterResult>;

type Props = {
  step: ExpenseFlowStep;
  setStep: (step: ExpenseFlowStep) => void;
  variant: ExpenseRegisterVariant;
  preselectedEnvelope?: ExpenseEnvelopeType;
  recentEnvelopes: ExpenseEnvelopeType[];
  currencySymbol: string;
  registerExpense: RegisterExpenseFn;
  onSuccess: (result: ExpenseRegisterResult) => void;
};

function createInitialEnvelope(
  variant: ExpenseRegisterVariant,
  preselected?: ExpenseEnvelopeType,
): ExpenseEnvelopeType {
  if (variant === "envelope" && preselected) return preselected;
  return "wants";
}

export function ExpenseRegisterForm({
  variant,
  preselectedEnvelope,
  ...props
}: Props) {
  const formKey = `${variant}:${preselectedEnvelope ?? "none"}`;

  return (
    <ExpenseRegisterFormFields
      key={formKey}
      variant={variant}
      preselectedEnvelope={preselectedEnvelope}
      {...props}
    />
  );
}

function ExpenseRegisterFormFields({
  step,
  setStep,
  variant,
  preselectedEnvelope,
  recentEnvelopes,
  currencySymbol,
  registerExpense,
  onSuccess,
}: Props) {
  const [serverError, setServerError] = useState<string | null>(null);

  const form = useForm({
    defaultValues: {
      amountCents: 0,
      envelopeType: createInitialEnvelope(variant, preselectedEnvelope),
      description: "",
    } satisfies ExpenseRegisterFormValues,
    validators: {
      onChange: expenseRegisterSchema,
      onSubmit: expenseRegisterSchema,
    },
    onSubmit: async ({ value }) => {
      setServerError(null);
      const envelopeType =
        variant === "envelope" && preselectedEnvelope
          ? preselectedEnvelope
          : value.envelopeType;
      try {
        const response = await registerExpense({
          amount: value.amountCents,
          description: value.description.trim(),
          envelopeType,
        });
        track(AnalyticsEvents.EXPENSE_REGISTERED, {
          amount: response.amount,
          envelope: response.envelopeType,
          entry_variant: variant,
        });
        onSuccess(response);
      } catch (error) {
        setServerError(fromConvexError(error).message);
      }
    },
  });

  function suggestionForAmount(amountCents: number) {
    return suggestEnvelope(amountCents, recentEnvelopes);
  }

  async function handleAmountNextFab() {
    setServerError(null);
    await form.validateField("amountCents", "submit");
    const amountMeta = form.getFieldMeta("amountCents");
    if (amountMeta?.isValid !== true) return;
    const { amountCents } = form.store.state.values;
    form.setFieldValue(
      "envelopeType",
      suggestionForAmount(amountCents).envelopeType,
    );
    setStep("envelope");
  }

  async function handleVariantBSubmit() {
    setServerError(null);
    await form.validateField("amountCents", "submit");
    await form.validateField("description", "submit");
    const amountMeta = form.getFieldMeta("amountCents");
    const descriptionMeta = form.getFieldMeta("description");
    if (amountMeta?.isValid !== true || descriptionMeta?.isValid !== true) {
      return;
    }
    if (!preselectedEnvelope) return;
    void form.handleSubmit();
  }

  if (step === "amount" && variant === "fab") {
    return (
      <AnimatedView viewKey={`${variant}-${step}`} direction="forward">
        <div className="space-y-4">
          <form.Field name="amountCents">
            {(field) => {
              const isInvalid =
                field.state.meta.isTouched && !field.state.meta.isValid;
              return (
                <Field data-invalid={isInvalid}>
                  <div className="text-center">
                    <p className="mb-1 font-mono text-[10px] tracking-widest text-mute uppercase">
                      {EXPENSE_AMOUNT_LABEL}
                    </p>
                    <p className="font-serif text-[46px] leading-none text-ink">
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
                      errors={field.state.meta.errors}
                    />
                  ) : null}
                </Field>
              );
            }}
          </form.Field>
          {serverError ? (
            <p className="text-center text-sm text-danger" role="alert">
              {serverError}
            </p>
          ) : null}
          <form.Subscribe
            selector={(state) =>
              [
                state.fieldMeta.amountCents?.isValid,
                state.isSubmitting,
              ] as const
            }
          >
            {([amountValid, isSubmitting]) => (
              <Button
                type="button"
                disabled={!amountValid || isSubmitting}
                onClick={() => void handleAmountNextFab()}
                className="h-12 w-full rounded-[12px] bg-ink text-[15px] font-semibold text-canvas hover:bg-ink/90"
              >
                {EXPENSE_NEXT_CTA}
                <ArrowRight size={20} color="currentColor" aria-hidden />
              </Button>
            )}
          </form.Subscribe>
        </div>
      </AnimatedView>
    );
  }

  if (step === "amount" && variant === "envelope" && preselectedEnvelope) {
    return (
      <AnimatedView viewKey={`${variant}-${step}`} direction="forward">
        <div>
          <form.Subscribe
            selector={(state) => ({
              amountCents: state.values.amountCents,
              description: state.values.description,
              isSubmitting: state.isSubmitting,
            })}
          >
            {({ amountCents: amount, description, isSubmitting }) => (
              <>
                <form.Field name="amountCents">
                  {(amountField) => (
                    <form.Field name="description">
                      {(descriptionField) => (
                        <ExpenseVariantBForm
                          envelopeType={preselectedEnvelope}
                          amountCents={amount}
                          description={description}
                          currencySymbol={currencySymbol}
                          isSubmitting={isSubmitting}
                          onAmountChange={(cents) => {
                            amountField.handleChange(cents);
                            amountField.handleBlur();
                          }}
                          onDescriptionChange={(value) => {
                            descriptionField.handleChange(value);
                          }}
                          onSubmit={() => void handleVariantBSubmit()}
                        />
                      )}
                    </form.Field>
                  )}
                </form.Field>
              </>
            )}
          </form.Subscribe>
          <form.Field name="amountCents">
            {(field) => {
              const isInvalid =
                field.state.meta.isTouched && !field.state.meta.isValid;
              return isInvalid ? (
                <FieldError
                  className="mt-2 text-center"
                  errors={field.state.meta.errors}
                />
              ) : null;
            }}
          </form.Field>
          <form.Field name="description">
            {(field) => {
              const isInvalid =
                field.state.meta.isTouched && !field.state.meta.isValid;
              return isInvalid ? (
                <FieldError
                  className="mt-2 text-center"
                  errors={field.state.meta.errors}
                />
              ) : null;
            }}
          </form.Field>
          {serverError ? (
            <p className="mt-3 text-center text-sm text-danger" role="alert">
              {serverError}
            </p>
          ) : null}
        </div>
      </AnimatedView>
    );
  }

  if (step === "envelope" && variant === "fab") {
    return (
      <AnimatedView viewKey={`${variant}-${step}`} direction="forward">
        <div>
          <form.Subscribe
            selector={(state) => ({
              amountCents: state.values.amountCents,
              envelopeType: state.values.envelopeType,
              isSubmitting: state.isSubmitting,
            })}
          >
            {({ amountCents: amount, envelopeType, isSubmitting }) => {
              const suggestion = suggestionForAmount(amount);
              return (
                <form.Field name="envelopeType">
                  {(field) => (
                    <ExpenseEnvelopeStep
                      amountCents={amount}
                      currencySymbol={currencySymbol}
                      selectedEnvelope={envelopeType}
                      suggestedEnvelope={suggestion.envelopeType}
                      hint={suggestion.hint}
                      isSubmitting={isSubmitting}
                      onSelectEnvelope={(type) => {
                        field.handleChange(type);
                        field.handleBlur();
                      }}
                      onConfirm={() => void form.handleSubmit()}
                    />
                  )}
                </form.Field>
              );
            }}
          </form.Subscribe>
          {serverError ? (
            <p className="mt-3 text-center text-sm text-danger" role="alert">
              {serverError}
            </p>
          ) : null}
        </div>
      </AnimatedView>
    );
  }

  return null;
}
