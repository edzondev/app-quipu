"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { toast } from "sonner";
import { fromConvexError } from "@/core/errors";
import { useMyProfile } from "@/modules/auth/hooks/use-my-profile";
import { CheckMark } from "@/modules/onboarding/components/check-mark";
import { DAY_PILLS } from "@/modules/onboarding/constants";
import { AppPageShell } from "@/shared/components/layout/app-page-shell";
import {
  AnimatedView,
  type AnimatedViewDirection,
} from "@/shared/components/ui/animated-view";
import { Button } from "@/shared/components/ui/button";
import { buttonVariants } from "@/shared/components/ui/button-variants";
import { cn } from "@/shared/lib/utils";
import { useUpdateCycleSchedule } from "../actions";
import {
  SETTINGS_CYCLE_WIZARD_BACK,
  SETTINGS_CYCLE_WIZARD_CONFIRM,
  SETTINGS_CYCLE_WIZARD_NEXT,
  SETTINGS_CYCLE_WIZARD_SAVED,
  SETTINGS_CYCLE_WIZARD_STEP1_BODY,
  SETTINGS_CYCLE_WIZARD_STEP1_TITLE,
  SETTINGS_CYCLE_WIZARD_STEP2_TITLE,
} from "../constants";
import {
  formatCycleStart,
  formatCycleType,
  formatIncomeProfileLabel,
} from "../lib/cycle-display";

type Step = 1 | 2 | 3;

type Profile = NonNullable<ReturnType<typeof useMyProfile>>;

function initialPayFrequency(profile: Profile): "monthly" | "biweekly" {
  if (
    profile.payFrequency === "monthly" ||
    profile.payFrequency === "biweekly"
  ) {
    return profile.payFrequency;
  }
  return "monthly";
}

function initialPaydays(profile: Profile): number[] {
  return profile.paydays?.length ? [...profile.paydays] : [];
}

function initialCycleDurationDays(profile: Profile): 15 | 30 {
  return profile.cycleDurationDays === 15 || profile.cycleDurationDays === 30
    ? profile.cycleDurationDays
    : 30;
}

export function CycleChangeWizard() {
  const profile = useMyProfile();

  if (!profile) {
    return (
      <AppPageShell maxWidth="lg" breadcrumbs="auto">
        <div className="h-40 animate-pulse rounded-2xl bg-surface" />
      </AppPageShell>
    );
  }

  return <CycleChangeWizardForm profile={profile} />;
}

function CycleChangeWizardForm({ profile }: { profile: Profile }) {
  const router = useRouter();
  const updateCycle = useUpdateCycleSchedule();
  const [step, setStep] = useState<Step>(1);
  const [direction, setDirection] = useState<AnimatedViewDirection>("forward");
  const [payFrequency, setPayFrequency] = useState<"monthly" | "biweekly">(() =>
    initialPayFrequency(profile),
  );
  const [paydays, setPaydays] = useState<number[]>(() =>
    initialPaydays(profile),
  );
  const [cycleDurationDays, setCycleDurationDays] = useState<15 | 30>(() =>
    initialCycleDurationDays(profile),
  );
  const [pending, startSave] = useTransition();

  const isVariable = profile.incomeModel === "variable";
  const isBiweekly = payFrequency === "biweekly";

  function goForward(next: Step) {
    setDirection("forward");
    setStep(next);
  }

  function goBack(prev: Step) {
    setDirection("back");
    setStep(prev);
  }

  function selectDay(day: number) {
    if (isBiweekly) {
      if (paydays.includes(day)) {
        const next = paydays.filter((d) => d !== day);
        setPaydays(next.length ? next : [day]);
      } else if (paydays.length >= 2) {
        const first = paydays[1];
        setPaydays(first !== undefined ? [first, day] : [day]);
      } else {
        setPaydays([...paydays, day]);
      }
    } else {
      setPaydays([day]);
    }
  }

  function confirmSave() {
    startSave(async () => {
      try {
        if (isVariable) {
          await updateCycle({ cycleDurationDays });
        } else {
          await updateCycle({ payFrequency, paydays });
        }
        toast.success(SETTINGS_CYCLE_WIZARD_SAVED);
        router.push("/settings/system");
      } catch (error) {
        toast.error(fromConvexError(error).message);
      }
    });
  }

  return (
    <AppPageShell maxWidth="lg" breadcrumbs="auto">
      <AnimatedView viewKey={step} direction={direction}>
        {step === 1 ? (
          <>
            <h1 className="font-serif text-[23px] font-medium text-ink">
              {SETTINGS_CYCLE_WIZARD_STEP1_TITLE}
            </h1>
            <p className="mt-2 text-[13px] leading-relaxed text-mute-subtle">
              {SETTINGS_CYCLE_WIZARD_STEP1_BODY}
            </p>
            <dl className="mt-6 space-y-3 rounded-xl border border-line/70 bg-card px-4 py-4">
              <div>
                <dt className="text-[11px] uppercase tracking-wide text-faint">
                  Perfil
                </dt>
                <dd className="text-sm font-semibold text-ink">
                  {formatIncomeProfileLabel(profile)}
                </dd>
              </div>
              <div>
                <dt className="text-[11px] uppercase tracking-wide text-faint">
                  Tipo
                </dt>
                <dd className="text-sm font-semibold text-ink">
                  {formatCycleType(profile)}
                </dd>
              </div>
              <div>
                <dt className="text-[11px] uppercase tracking-wide text-faint">
                  Inicio habitual
                </dt>
                <dd className="text-sm font-semibold text-ink">
                  {formatCycleStart(profile)}
                </dd>
              </div>
            </dl>
            <Button
              type="button"
              className="mt-6 w-full"
              onClick={() => goForward(2)}
            >
              {SETTINGS_CYCLE_WIZARD_NEXT}
            </Button>
          </>
        ) : null}

        {step === 2 ? (
          <>
            <h1 className="font-serif text-[23px] font-medium text-ink">
              {SETTINGS_CYCLE_WIZARD_STEP2_TITLE}
            </h1>
            {isVariable ? (
              <div className="mt-6 flex gap-3">
                {([15, 30] as const).map((days) => {
                  const selected = cycleDurationDays === days;
                  return (
                    <button
                      key={days}
                      type="button"
                      aria-pressed={selected}
                      onClick={() => setCycleDurationDays(days)}
                      className={cn(
                        "flex-1 rounded-xl border px-4 py-4 text-left transition-colors",
                        selected
                          ? "border-qp bg-qp-soft"
                          : "border-line bg-card hover:bg-surface-warm",
                      )}
                    >
                      <div className="font-semibold text-ink">{days} días</div>
                      <div className="text-[12px] text-mute">Por ciclo</div>
                    </button>
                  );
                })}
              </div>
            ) : (
              <>
                <div className="mt-6 flex gap-3">
                  {(["monthly", "biweekly"] as const).map((freq) => {
                    const selected = payFrequency === freq;
                    return (
                      <button
                        key={freq}
                        type="button"
                        aria-pressed={selected}
                        onClick={() => {
                          setPayFrequency(freq);
                          setPaydays([]);
                        }}
                        className={cn(
                          "flex-1 rounded-xl border px-4 py-3 text-left",
                          selected
                            ? "border-qp bg-qp-soft"
                            : "border-line bg-card",
                        )}
                      >
                        <div className="text-sm font-semibold text-ink">
                          {freq === "monthly" ? "Mensual" : "Quincenal"}
                        </div>
                      </button>
                    );
                  })}
                </div>
                <p className="mt-4 text-[13px] text-mute">
                  Día{isBiweekly ? "s" : ""} de pago
                </p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {DAY_PILLS.map((day) => {
                    const selected = paydays.includes(day);
                    return (
                      <button
                        key={day}
                        type="button"
                        aria-pressed={selected}
                        onClick={() => selectDay(day)}
                        className={cn(
                          "relative flex size-10 items-center justify-center rounded-full border text-sm font-medium",
                          selected
                            ? "border-qp bg-qp-soft text-qp-deep"
                            : "border-line bg-card text-ink-secondary",
                        )}
                      >
                        {day}
                        {selected ? (
                          <CheckMark className="absolute -right-0.5 -top-0.5" />
                        ) : null}
                      </button>
                    );
                  })}
                </div>
              </>
            )}
            <div className="mt-8 flex gap-2">
              <Button
                type="button"
                variant="outline"
                className="flex-1 border-line"
                onClick={() => goBack(1)}
              >
                {SETTINGS_CYCLE_WIZARD_BACK}
              </Button>
              <Button
                type="button"
                className="flex-1"
                disabled={!isVariable && paydays.length === 0}
                onClick={() => goForward(3)}
              >
                {SETTINGS_CYCLE_WIZARD_NEXT}
              </Button>
            </div>
          </>
        ) : null}

        {step === 3 ? (
          <>
            <h1 className="font-serif text-[23px] font-medium text-ink">
              Confirmar
            </h1>
            <p className="mt-2 text-[13px] text-mute-subtle">
              {isVariable
                ? `Próximos ciclos de ${cycleDurationDays} días.`
                : `${payFrequency === "monthly" ? "Mensual" : "Quincenal"} · días ${paydays.join(", ")}.`}
            </p>
            <div className="mt-8 flex flex-col gap-2">
              <Button
                type="button"
                disabled={pending}
                onClick={() => void confirmSave()}
              >
                {SETTINGS_CYCLE_WIZARD_CONFIRM}
              </Button>
              <button
                type="button"
                className={cn(
                  buttonVariants({ variant: "ghost" }),
                  "text-mute",
                )}
                onClick={() => goBack(2)}
              >
                {SETTINGS_CYCLE_WIZARD_BACK}
              </button>
            </div>
          </>
        ) : null}
      </AnimatedView>
    </AppPageShell>
  );
}
