"use client";

import { api } from "@/convex/_generated/api";
import { calcularSplit } from "@/lib/quipu-calculator";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "convex/react";
import { ConvexError } from "convex/values";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import {
  type OnboardingFormData,
  onboardingSchema,
  stepTwoSchema,
  stepThreeSchema,
  stepFourSchema,
  stepWorkerTypeSchema,
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
  const [step, setStep] = useState(1);
  const [direction, setDirection] = useState<"forward" | "backward">("forward");
  const [submitError, setSubmitError] = useState<string | null>(null);

  const createProfile = useMutation(api.profiles.createProfile);
  const completeOnboarding = useMutation(api.profiles.completeOnboarding);

  // monthlyIncome is NOT part of OnboardingFormData (not sent to the backend),
  // but lives in the form so step components can read and validate it locally.
  const form = useForm<OnboardingFormData & { monthlyIncome: number }>({
    resolver: zodResolver(onboardingSchema),
    defaultValues: {
      name: "",
      country: "Peru",
      currencyCode: "PEN",
      currencySymbol: "S/",
      currencyName: "Sol peruano",
      currencyLocale: "es-PE",
      workerType: undefined,
      monthlyIncome: 0,
      payFrequency: "monthly",
      paydays: [1],
      initialRemainingBudget: undefined,
      allocationNeeds: 50,
      allocationWants: 30,
      allocationSavings: 20,
    },
  });

  const isFirstStep = step === 1;
  const isLastStep = step === 5;

  const goNext = async () => {
    if (step === 1) {
      setDirection("forward");
      setStep(2);
      return;
    }

    const schema = STEP_SCHEMAS[step];
    if (!schema) return;

    const values = form.getValues();
    const result = schema.safeParse(values);

    if (!result.success) {
      for (const issue of result.error.issues) {
        const fieldName = issue.path[0] as keyof typeof values;
        if (fieldName) {
          form.setError(fieldName, { message: issue.message });
        }
      }
      return;
    }

    form.clearErrors();
    setDirection("forward");
    setStep((s) => s + 1);
  };

  const goBack = () => {
    if (step <= 1) return;
    form.clearErrors();
    setDirection("backward");
    setStep((s) => s - 1);
  };

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
        initialRemainingBudget:
          isMidMonth && data.initialRemainingBudget !== undefined
            ? data.initialRemainingBudget
            : undefined,
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
    step,
    direction,
    isFirstStep,
    isLastStep,
    goNext,
    goBack,
    handleSubmit,
    isSubmitting: form.formState.isSubmitting,
    submitError,
  };
}
