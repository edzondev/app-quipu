"use client";

import { useMutation } from "convex/react";
import { useState } from "react";
import { ArrowRight } from "reicon-react/icons/ArrowRight";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { AnalyticsEvents, track } from "@/core/analytics";
import { COACH_CRISIS_LATER_CTA } from "@/modules/coach/constants";
import type { DashboardCoach } from "@/modules/dashboard/types";
import { Button } from "@/shared/components/ui/button";
import { withPending } from "@/shared/lib/with-pending";

type CrisisOption = NonNullable<DashboardCoach["crisisOptions"]>[number];

type Props = {
  options: CrisisOption[];
};

export function CoachCrisisActions({ options }: Props) {
  const applyCover = useMutation(api.coachEngine.applyCoverFromCycleSavings);
  const postponeCommitment = useMutation(
    api.coachEngine.postponeCommitmentForCycle,
  );
  const snoozeCrisis = useMutation(api.coachEngine.snoozeCrisisCoach);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleOption(option: CrisisOption) {
    await withPending(setIsSubmitting, async () => {
      if (option.id === "cover_from_savings") {
        await applyCover({});
        track(AnalyticsEvents.CRISIS_RECOMMENDATION_RESOLVED, {
          action: "completed",
          option_id: option.id,
        });
        return;
      }

      if (option.commitmentId) {
        await postponeCommitment({
          commitmentId: option.commitmentId as Id<"fixedCommitments">,
        });
        track(AnalyticsEvents.CRISIS_RECOMMENDATION_RESOLVED, {
          action: "postponed",
          option_id: option.id,
        });
      }
    });
  }

  async function handleSnooze() {
    await withPending(setIsSubmitting, async () => {
      await snoozeCrisis({});
      track(AnalyticsEvents.CRISIS_RECOMMENDATION_RESOLVED, {
        action: "dismissed",
        option_id: "snooze",
      });
    });
  }

  if (options.length === 0) {
    return (
      <div className="mt-4">
        <Button
          type="button"
          size="sm"
          variant="outline"
          disabled={isSubmitting}
          onClick={() => void handleSnooze()}
          className="rounded-[11px] border-danger-line bg-canvas/70 text-danger-ink"
        >
          {COACH_CRISIS_LATER_CTA}
        </Button>
      </div>
    );
  }

  return (
    <div className="mt-4 space-y-3">
      <p className="text-sm text-danger-ink/80">
        Resolvámoslo ahora en un paso. Elige de dónde sale:
      </p>
      <div className="grid gap-2.5 md:grid-cols-2">
        {options.map((option) => (
          <button
            key={option.id}
            type="button"
            disabled={isSubmitting}
            onClick={() => void handleOption(option)}
            className="flex items-center gap-3 rounded-[12px] border border-danger-line bg-canvas px-3.5 py-3 text-left transition-colors hover:bg-canvas/90 disabled:opacity-60"
          >
            <span
              className={`size-2.5 shrink-0 rounded-full ${
                option.id === "cover_from_savings" ? "bg-moss" : "bg-clay"
              }`}
              aria-hidden
            />
            <span className="min-w-0 flex-1">
              <span className="block text-[13.5px] font-semibold text-ink">
                {option.title}
              </span>
              <span className="mt-0.5 block text-[11.5px] text-mute">
                {option.subtitle}
              </span>
            </span>
            <ArrowRight
              size={16}
              color="currentColor"
              className="shrink-0 text-danger"
              aria-hidden
            />
          </button>
        ))}
      </div>
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
  );
}
