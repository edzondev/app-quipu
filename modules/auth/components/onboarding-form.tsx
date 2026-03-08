"use client";

import { Button } from "@/core/components/ui/button";
import { useOnboarding } from "@/modules/auth/hooks/use-onboarding";
import {
  GalleryVerticalEnd,
  ArrowLeft,
  ArrowRight,
  Loader2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import StepWelcome from "./steps/step-welcome";
import StepProfile from "./steps/step-profile";
import StepWorkerType from "./steps/step-worker-type";
import StepIncome from "./steps/step-income";
import StepPlan from "./steps/step-plan";

const TOTAL_INDICATOR_STEPS = 4;

export function OnboardingForm() {
  const {
    form,
    step,
    direction,
    isFirstStep,
    isLastStep,
    goNext,
    goBack,
    handleSubmit,
    isSubmitting,
    submitError,
  } = useOnboarding();

  const indicatorStep = step - 1;

  const stepContent = {
    1: <StepWelcome />,
    2: <StepProfile form={form} />,
    3: <StepWorkerType form={form} />,
    4: <StepIncome form={form} />,
    5: <StepPlan form={form} />,
  };

  const animationClass =
    direction === "forward"
      ? "animate-in fade-in slide-in-from-right-4 duration-300"
      : "animate-in fade-in slide-in-from-left-4 duration-300";

  return (
    <div className="min-h-svh flex flex-col bg-background">
      <div className="flex flex-col gap-4 p-6 md:p-10">
        <div className="flex justify-center gap-2 md:justify-start">
          <a href="#" className="flex items-center gap-2 font-medium">
            <div className="flex size-6 items-center justify-center rounded-md bg-primary text-primary-foreground">
              <GalleryVerticalEnd className="size-4" />
            </div>
            Quipu
          </a>
        </div>
      </div>

      {!isFirstStep && (
        <div className="px-6 md:px-10 pb-2">
          <div className="flex items-center justify-center gap-2 max-w-xs mx-auto">
            {Array.from({ length: TOTAL_INDICATOR_STEPS }, (_, i) => (
              <div
                key={i}
                className={cn(
                  "h-1.5 flex-1 rounded-full transition-all duration-300",
                  i < indicatorStep ? "bg-primary" : "bg-muted",
                )}
              />
            ))}
          </div>
        </div>
      )}

      <div className="flex-1 flex items-start justify-center px-6 py-8 md:px-10">
        <div className="w-full max-w-lg">
          <form
            id="form-onboarding"
            onSubmit={handleSubmit}
            className="flex flex-col gap-8"
          >
            <div key={step} className={animationClass}>
              {stepContent[step as keyof typeof stepContent]}
            </div>

            <div className="flex flex-col gap-3">
              {isFirstStep && (
                <Button
                  type="button"
                  size="lg"
                  className="w-full"
                  onClick={goNext}
                >
                  Empezar <ArrowRight className="ml-2 w-4 h-4" />
                </Button>
              )}

              {!isFirstStep && !isLastStep && (
                <div className="flex gap-3">
                  <Button
                    type="button"
                    variant="outline"
                    size="lg"
                    onClick={goBack}
                    className="px-4"
                  >
                    <ArrowLeft className="w-4 h-4" />
                    <span className="sr-only">Atrás</span>
                  </Button>
                  <Button
                    type="button"
                    size="lg"
                    className="flex-1"
                    onClick={goNext}
                  >
                    Continuar <ArrowRight className="ml-2 w-4 h-4" />
                  </Button>
                </div>
              )}

              {isLastStep && (
                <div className="flex flex-col gap-2">
                  <div className="flex gap-3">
                    <Button
                      type="button"
                      variant="ghost"
                      size="lg"
                      onClick={goBack}
                      disabled={isSubmitting}
                      className="px-4"
                    >
                      <ArrowLeft className="w-4 h-4" />
                      <span className="sr-only">Atrás</span>
                    </Button>
                    <Button
                      type="submit"
                      form="form-onboarding"
                      size="lg"
                      disabled={isSubmitting}
                      className="flex-1"
                    >
                      {isSubmitting ? (
                        <>
                          <Loader2 className="mr-2 w-4 h-4 animate-spin" />
                          Activando...
                        </>
                      ) : (
                        <>
                          Activar mi plan{" "}
                          <ArrowRight className="ml-2 w-4 h-4" />
                        </>
                      )}
                    </Button>
                  </div>
                  {submitError && (
                    <p className="text-destructive text-sm mt-1 text-center">
                      {submitError}
                    </p>
                  )}
                </div>
              )}
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
