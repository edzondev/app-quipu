"use client";

import { useMutation } from "convex/react";
import { useTransition } from "react";
import { api } from "@/convex/_generated/api";
import { AnalyticsEvents, track } from "@/core/analytics";
import {
  COACH_CRISIS_LATER_CTA,
  COACH_CRISIS_PLAN_CTA,
  COACH_CRISIS_PLAN_HEADING,
} from "@/modules/coach/constants";
import type { DashboardCoach } from "@/modules/dashboard/types";
import { Button } from "@/shared/components/ui/button";

type CrisisPlan = NonNullable<DashboardCoach["crisisPlan"]>;

type Props = {
  plan: CrisisPlan;
};

export function CoachCrisisPlanActions({ plan }: Props) {
  const applyCrisisPlan = useMutation(api.coachEngine.applyCrisisPlan);
  const snoozeCrisis = useMutation(api.coachEngine.snoozeCrisisCoach);
  const [isSubmitting, startSubmit] = useTransition();

  function handleApplyPlan() {
    startSubmit(async () => {
      await applyCrisisPlan({});
      track(AnalyticsEvents.CRISIS_RECOMMENDATION_RESOLVED, {
        action: "completed",
        option_id: "crisis_plan",
      });
    });
  }

  function handleSnooze() {
    startSubmit(async () => {
      await snoozeCrisis({});
      track(AnalyticsEvents.CRISIS_RECOMMENDATION_RESOLVED, {
        action: "dismissed",
        option_id: "snooze",
      });
    });
  }

  return (
    <div className="mt-4 space-y-3">
      <p className="font-mono text-[10px] uppercase tracking-[0.1em] text-danger-ink/70">
        {COACH_CRISIS_PLAN_HEADING}
      </p>
      <ol className="space-y-2">
        {plan.steps.map((step) => (
          <li
            key={`${step.kind}-${step.order}`}
            className="flex gap-3 rounded-[12px] border border-danger-line bg-canvas px-3.5 py-3 text-left"
          >
            <span
              className="flex size-6 shrink-0 items-center justify-center rounded-full bg-danger text-[12px] font-semibold text-canvas"
              aria-hidden
            >
              {step.order}
            </span>
            <span className="text-[13.5px] font-semibold leading-snug text-ink">
              {step.label}
            </span>
          </li>
        ))}
      </ol>
      <p className="text-sm text-danger-ink/85">{plan.outcomeLabel}</p>
      <div className="flex flex-wrap gap-2">
        <Button
          type="button"
          size="sm"
          disabled={isSubmitting}
          onClick={() => void handleApplyPlan()}
          className="rounded-[11px] bg-danger text-canvas hover:bg-danger/90"
        >
          {COACH_CRISIS_PLAN_CTA}
        </Button>
        <Button
          type="button"
          size="sm"
          variant="ghost"
          disabled={isSubmitting}
          onClick={() => void handleSnooze()}
          className="h-auto px-0 text-[13px] font-semibold text-danger-ink/80 hover:bg-transparent hover:text-danger-ink"
        >
          {COACH_CRISIS_LATER_CTA}
        </Button>
      </div>
    </div>
  );
}
