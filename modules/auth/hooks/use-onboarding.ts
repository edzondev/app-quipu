"use client";

import { api } from "@/convex/_generated/api";
import { calcularSplit } from "@/lib/quipu-calculator";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "convex/react";
import { ConvexError } from "convex/values";
import { useRouter } from "next/navigation";
import { useCallback, useState } from "react";
import { useForm } from "react-hook-form";
import {
  type OnboardingFormData,
  onboardingSchema,
  stepTwoSchema,
  stepThreeSchema,
  stepFourSchema,
  stepWorkerTypeSchema,
  defaultValues,
  stepFields,
  STEP_COUNT,
} from "@/modules/auth/validations/onboarding";

const STEP_SCHEMAS: Record<
  number,
  | typeof stepTwoSchema
  | typeof stepWorkerTypeSchema
  | typeof stepThreeSchema
  | typeof stepFourSchema
> = {
  2: stepTwoSchema,
  3: stepWorkerTypeSchema,
  4: stepThreeSchema,
  5: stepFourSchema,
};

export function useOnboarding() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(0);
  const [direction, setDirection] = useState<"forward" | "backward">("forward");
  const [submitError, setSubmitError] = useState<string | null>(null);

  const createProfile = useMutation(api.profiles.createProfile);
  const completeOnboarding = useMutation(api.profiles.completeOnboarding);

  // monthlyIncome is NOT part of OnboardingFormData (not sent to the backend),
  // but lives in the form so step components can read and validate it locally.
  const form = useForm<OnboardingFormData>({
    resolver: zodResolver(onboardingSchema),
    defaultValues,
    mode: "onTouched",
    reValidateMode: "onChange",
  });

  const goNext = useCallback(async () => {
    console.log("currentStep", currentStep, "STEP_COUNT", STEP_COUNT);

    // Some steps (like the welcome/intro step) don't have any form fields.
    // `stepFields` maps schemas to the step index; if there are no fields for
    // the current step, skip validation so the user can advance.
    const fields = stepFields[currentStep] ?? [];
    if (fields.length === 0) {
      setCurrentStep((s) => Math.min(s + 1, STEP_COUNT - 1));
      setDirection("forward");
      return;
    }

    const isValid = await form.trigger(fields, {
      shouldFocus: true,
    });
    console.log("isValid", isValid);
    if (!isValid) return;

    setCurrentStep((s) => Math.min(s + 1, STEP_COUNT - 1));
    setDirection("forward");
  }, [currentStep, form]);

  const goBack = useCallback(() => {
    setCurrentStep((s) => Math.max(0, s - 1));
    setDirection("backward");
  }, []);

  const handleSubmit = form.handleSubmit(async (data) => {
    setSubmitError(null);
    try {
      const isIndependent = data.workerType === "independent";

      // monthlyIncome is transient — only used here for goal calculations
      const monthlyIncome = form.getValues("monthlyIncome");
      const split = calcularSplit(monthlyIncome, {
        needs: data.allocationNeeds,
        wants: data.allocationWants,
        savings: data.allocationSavings,
      });

      // Emergency fund target: 3 months of income
      const savingsGoalEmergency = monthlyIncome * 3;
      // Investment goal target: 1 year of monthly savings contributions
      const savingsGoalInvestment = Math.round(split.savings * 12);

      // Determine if user is signing up mid-month (not on their payday)
      const todayDay = new Date().getDate();
      const isMidMonth =
        !isIndependent &&
        data.paydays != null &&
        !data.paydays.includes(todayDay);

      // For mid-month signups, use monthlyIncome as initialRemainingBudget if not provided
      let initialRemainingBudget: number | undefined = undefined;
      if (isMidMonth) {
        initialRemainingBudget =
          data.initialRemainingBudget && data.initialRemainingBudget > 0
            ? data.initialRemainingBudget
            : monthlyIncome;
      }

      await createProfile({
        name: data.name,
        country: data.country,
        currencyCode: data.currencyCode,
        currencySymbol: data.currencySymbol,
        currencyName: data.currencyName,
        currencyLocale: data.currencyLocale,
        workerType: data.workerType,
        payFrequency: isIndependent ? undefined : data.payFrequency,
        paydays: isIndependent ? undefined : data.paydays,
        estimatedMonthlyIncome: isIndependent ? monthlyIncome : undefined,
        allocationNeeds: data.allocationNeeds,
        allocationWants: data.allocationWants,
        allocationSavings: data.allocationSavings,
        savingsGoalEmergency,
        savingsGoalInvestment,
        initialRemainingBudget,
      });
      await completeOnboarding();
      router.push("/dashboard");
    } catch (err) {
      if (err instanceof ConvexError) {
        setSubmitError(String(err.data));
      } else {
        setSubmitError("Ocurrió un error. Inténtalo de nuevo.");
      }
    }
  });

  return {
    form,
    currentStep,
    isFirstStep: currentStep === 0,
    isLastStep: currentStep === STEP_COUNT - 1,
    totalSteps: STEP_COUNT,
    goNext,
    goBack,
    handleSubmit,
    isSubmitting: form.formState.isSubmitting,
    submitError,
    direction,
  };
}
