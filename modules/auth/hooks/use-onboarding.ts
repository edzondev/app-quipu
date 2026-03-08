"use client";

import { api } from "@/convex/_generated/api";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "convex/react";
import { ConvexError } from "convex/values";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import {
  type OnboardingFormData,
  onboardingSchema,
  stepThreeSchema,
  stepTwoSchema,
  stepFourSchema,
} from "@/modules/auth/validations/onboarding";

const STEP_SCHEMAS: Record<
  number,
  typeof stepTwoSchema | typeof stepThreeSchema | typeof stepFourSchema
> = {
  2: stepTwoSchema,
  3: stepThreeSchema,
  4: stepFourSchema,
};

export function useOnboarding() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [direction, setDirection] = useState<"forward" | "backward">("forward");
  const [submitError, setSubmitError] = useState<string | null>(null);

  const createProfile = useMutation(api.profiles.createProfile);
  const completeOnboarding = useMutation(api.profiles.completeOnboarding);

  const form = useForm<OnboardingFormData>({
    resolver: zodResolver(onboardingSchema),
    defaultValues: {
      name: "",
      country: "Peru",
      currencyCode: "PEN",
      currencySymbol: "S/",
      currencyName: "Sol peruano",
      currencyLocale: "es-PE",
      monthlyIncome: 0,
      payFrequency: "monthly",
      paydays: [1],
      allocationNeeds: 50,
      allocationWants: 30,
      allocationSavings: 20,
    },
  });

  const isFirstStep = step === 1;
  const isLastStep = step === 4;

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
        const fieldName = issue.path[0] as keyof OnboardingFormData;
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
      // Compute savings goal targets from income and allocation
      const monthlySavings =
        data.monthlyIncome * (data.allocationSavings / 100);
      // Emergency fund target: 3 months of income
      const savingsGoalEmergency = data.monthlyIncome * 3;
      // Investment goal target: 1 year of monthly savings contributions
      const savingsGoalInvestment = Math.round(monthlySavings * 12);

      await createProfile({
        name: data.name,
        country: data.country,
        currencyCode: data.currencyCode,
        currencySymbol: data.currencySymbol,
        currencyName: data.currencyName,
        currencyLocale: data.currencyLocale,
        payFrequency: data.payFrequency,
        paydays: data.paydays,
        monthlyIncome: data.monthlyIncome,
        allocationNeeds: data.allocationNeeds,
        allocationWants: data.allocationWants,
        allocationSavings: data.allocationSavings,
        savingsGoalEmergency,
        savingsGoalInvestment,
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
