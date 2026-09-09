import type { Doc, Id } from "./_generated/dataModel";
import { query } from "./_generated/server";
import { resolveCoachPresentation } from "./lib/coachState";
import {
  computeCoverageProgressPercent,
  computeUncoveredCommitmentRemainingCents,
  daysUntilNextDue,
  mapCoverageStatusToDashboard,
} from "./lib/commitmentCoverage";
import { resolveCommitmentNextDueAt } from "./lib/commitmentDueDate";
import { resolveCommitmentPaymentStatus } from "./lib/commitmentPayment";
import { sumActiveReservedCents } from "./lib/commitmentReservation";
import { buildCrisisPlan } from "./lib/crisisPlan";
import { buildCrisisCoachOptions } from "./lib/crisisResolution";
import {
  buildDailyRateCopy,
  buildEarlyCycleHeroBody,
  buildValidationCopy,
  computeCycleDayMetrics,
  computeDisplayDailyCents,
  computeEnvelopePercentRemaining,
  computeSurplusProjection,
  detectEarlyCycle,
  evaluateCycleCompliance,
  mergeRecentMovements,
  resolveHeroStatusBadge,
  sortCommitmentsByDue,
} from "./lib/dashboardMath";
import { buildCoverageByIdFromCycleDocs } from "./lib/loadCycleCoverageContext";
import { computeSpendableSnapshot } from "./lib/spendableBalance";

const ENVELOPE_ORDER = ["needs", "wants", "savings"] as const;

function envelopeLabel(type: "needs" | "wants" | "savings"): string {
  switch (type) {
    case "needs":
      return "Necesidades";
    case "wants":
      return "Gustos";
    case "savings":
      return "Ahorro";
  }
}

export const getSummary = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return null;

    const profile = await ctx.db
      .query("profiles")
      .withIndex("by_userId", (q) => q.eq("userId", identity.subject))
      .unique();
    if (!profile) return null;

    const [commitmentsRaw, activeCycle] = await Promise.all([
      ctx.db
        .query("fixedCommitments")
        .withIndex("by_profileId", (q) => q.eq("profileId", profile._id))
        .collect(),
      ctx.db
        .query("financialCycles")
        .withIndex("by_profile_status", (q) =>
          q.eq("profileId", profile._id).eq("status", "active"),
        )
        .unique(),
    ]);

    const now = Date.now();

    if (!activeCycle) {
      const emptyCommitments = sortCommitmentsByDue(
        commitmentsRaw.map((commitment) => {
          const nextDueAt = resolveCommitmentNextDueAt({
            dueDay: commitment.dueDay,
            nextDueAt: commitment.nextDueAt,
            createdAt: commitment._creationTime,
          });
          return {
            id: commitment._id,
            name: commitment.name,
            amount: commitment.amount,
            envelope: commitment.envelope,
            dueDay: commitment.dueDay,
            nextDueAt,
            daysUntilDue: daysUntilNextDue(nextDueAt, now),
            covered: 0,
            remaining: commitment.amount,
            progressPercent: 0,
            coverageStatus: "uncovered" as const,
            cascadeStatus: "not-started" as const,
            paymentStatus: resolveCommitmentPaymentStatus({
              paidAt: commitment.paidAt,
              paidForCycleId: commitment.paidForCycleId,
              activeCycleId: null,
              nextDueAt,
              now,
            }),
            paidAtForCycle: undefined,
          };
        }),
      );

      return {
        profile: {
          name: profile.name,
          currencyCode: profile.currencyCode,
          plan: profile.plan,
        },
        cycle: null,
        hero: null,
        envelopes: [],
        commitments: emptyCommitments,
        coach: null,
        movements: [],
        isEarlyCycle: false,
      };
    }

    const envelopesRaw = await ctx.db
      .query("envelopes")
      .withIndex("by_cycle_type", (q) => q.eq("cycleId", activeCycle._id))
      .collect();

    const envelopeByType = new Map<
      "needs" | "wants" | "savings",
      Doc<"envelopes">
    >();
    for (const envelope of envelopesRaw) {
      envelopeByType.set(envelope.type, envelope);
    }

    const cycleMetrics = computeCycleDayMetrics(
      activeCycle.startDate,
      activeCycle.endDate,
      now,
    );

    const compliance = evaluateCycleCompliance(envelopesRaw);
    const wantsEnvelope = envelopeByType.get("wants");
    const needsEnvelope = envelopeByType.get("needs");
    const savingsEnvelope = envelopeByType.get("savings");

    const reservationsForCycle = await ctx.db
      .query("commitmentReservations")
      .withIndex("by_cycle", (q) => q.eq("cycleId", activeCycle._id))
      .collect();
    const spendable = computeSpendableSnapshot({
      needsRemainingCents: needsEnvelope?.remainingAmount ?? 0,
      wantsRemainingCents: wantsEnvelope?.remainingAmount ?? 0,
      savingsRemainingCents: savingsEnvelope?.remainingAmount ?? 0,
      unallocatedCents: activeCycle.unallocatedCents ?? 0,
      activeReservedCents: sumActiveReservedCents(reservationsForCycle),
      daysRemaining: cycleMetrics.daysRemaining,
    });
    const dailyAvailableCents = spendable.dailyAvailableCents;

    const [expensesRaw, incomesForCycle] = await Promise.all([
      ctx.db
        .query("expenses")
        .withIndex("by_cycle_envelope_time", (q) =>
          q.eq("cycleId", activeCycle._id),
        )
        .order("desc")
        .take(8),
      ctx.db
        .query("incomeEvents")
        .withIndex("by_cycle", (q) => q.eq("cycleId", activeCycle._id))
        .collect(),
    ]);

    const expenseCount = expensesRaw.length;

    const incomesRaw = incomesForCycle
      .sort((a, b) => b.occurredAt - a.occurredAt)
      .slice(0, 8);

    const envelopeTypeById = new Map(
      envelopesRaw.map((envelope) => [envelope._id, envelope.type]),
    );

    const movements = mergeRecentMovements(
      expensesRaw.map((expense) => ({
        id: expense._id,
        description: expense.description,
        amount: expense.amount,
        timestamp: expense.timestamp,
        envelopeType: envelopeTypeById.get(expense.envelopeId),
      })),
      incomesRaw.map((income) => ({
        id: income._id,
        description: income.description,
        amount: income.amount,
        occurredAt: income.occurredAt,
        incomeKind: income.incomeKind,
        appliedByAutoRule: income.appliedByAutoRule,
      })),
      4,
    ).map((movement) => ({
      ...movement,
      envelopeLabel: movement.envelopeLabel
        ? envelopeLabel(movement.envelopeLabel as "needs" | "wants" | "savings")
        : undefined,
    }));

    const isEarlyCycle = detectEarlyCycle({
      expenseCount,
      daysElapsed: cycleMetrics.daysElapsed,
      movementCount: movements.length,
    });

    const statusBadge = resolveHeroStatusBadge(compliance, isEarlyCycle);

    const hero = {
      dailyAvailableCents,
      displayDailyCents: computeDisplayDailyCents(dailyAvailableCents),
      rateLine: buildDailyRateCopy({
        dailyCents: dailyAvailableCents,
        spendableCents: spendable.spendableCents,
        daysRemaining: cycleMetrics.daysRemaining,
        currencySymbol: profile.currencySymbol,
      }),
      bodyCopy: isEarlyCycle ? buildEarlyCycleHeroBody() : undefined,
      validationCopy: isEarlyCycle
        ? undefined
        : buildValidationCopy(statusBadge),
      statusBadge,
      spendableCents: spendable.spendableCents,
      reservedCents: spendable.reservedCents,
      unallocatedCents: spendable.unallocatedCents,
    };

    const envelopes = ENVELOPE_ORDER.map((type) => {
      const envelope = envelopeByType.get(type);
      const remainingAmount = envelope?.remainingAmount ?? 0;
      const allocatedAmount = envelope?.allocatedAmount ?? 0;
      return {
        type,
        remainingAmount,
        allocatedAmount,
        percentRemaining: computeEnvelopePercentRemaining(
          remainingAmount,
          allocatedAmount,
        ),
      };
    });

    const commitmentCoverageById = buildCoverageByIdFromCycleDocs(
      {
        cycle: activeCycle,
        commitments: commitmentsRaw,
        incomeEvents: incomesForCycle,
        reservationRows: reservationsForCycle,
      },
      now,
    );

    const commitments = sortCommitmentsByDue(
      commitmentsRaw.map((commitment) => {
        const nextDueAt = resolveCommitmentNextDueAt({
          dueDay: commitment.dueDay,
          nextDueAt: commitment.nextDueAt,
          createdAt: commitment._creationTime,
        });
        const coverage = commitmentCoverageById.get(commitment._id);
        const covered = coverage?.covered ?? 0;
        const remaining = coverage?.remaining ?? commitment.amount;
        const cascadeStatus = coverage?.status ?? "not-started";
        const paymentStatus = resolveCommitmentPaymentStatus({
          paidAt: commitment.paidAt,
          paidForCycleId: commitment.paidForCycleId,
          activeCycleId: activeCycle._id,
          nextDueAt,
          now,
        });

        return {
          id: commitment._id,
          name: commitment.name,
          amount: commitment.amount,
          envelope: commitment.envelope,
          dueDay: commitment.dueDay,
          nextDueAt,
          daysUntilDue: daysUntilNextDue(nextDueAt, now),
          covered,
          remaining,
          progressPercent: computeCoverageProgressPercent(
            covered,
            commitment.amount,
          ),
          coverageStatus: mapCoverageStatusToDashboard(cascadeStatus),
          cascadeStatus,
          paymentStatus,
          paidAtForCycle:
            paymentStatus === "paid" ? commitment.paidAt : undefined,
        };
      }),
    );

    const pendingCoach = await ctx.db
      .query("coachInteractions")
      .withIndex("by_profile_status", (q) =>
        q.eq("profileId", profile._id).eq("status", "pending"),
      )
      .order("desc")
      .first();

    const uncoveredCommitmentsCents = computeUncoveredCommitmentRemainingCents(
      commitments.map((commitment) => ({
        remaining: commitment.remaining,
        status: commitment.cascadeStatus,
      })),
    );

    const savingsRemaining =
      envelopeByType.get("savings")?.remainingAmount ?? 0;
    const crisisOptions = buildCrisisCoachOptions({
      commitments: commitments.map((commitment) => ({
        id: commitment.id,
        name: commitment.name,
        amount: commitment.amount,
        remaining: commitment.remaining,
        envelope: commitment.envelope,
        dueDay: commitment.dueDay,
      })),
      savingsRemaining,
      currencySymbol: profile.currencySymbol,
    });

    const coachPresentation = resolveCoachPresentation({
      pendingCoach: pendingCoach
        ? {
            id: pendingCoach._id,
            triggerEvent: pendingCoach.triggerEvent,
            initialNudge: pendingCoach.initialNudge,
            options: pendingCoach.options,
          }
        : null,
      isEarlyCycle,
      compliance,
      uncoveredCommitmentsCents,
      profileName: profile.name,
      surplusCents: computeSurplusProjection(envelopes),
      currencySymbol: profile.currencySymbol,
      crisisSnoozed:
        profile.coachCrisisSnoozedUntil != null &&
        profile.coachCrisisSnoozedUntil > now,
      crisisOptions,
    });

    const crisisPlan =
      profile.plan === "premium" && coachPresentation.kind === "crisis"
        ? buildCrisisPlan({
            commitments: commitments.map((commitment) => ({
              id: commitment.id,
              name: commitment.name,
              amount: commitment.amount,
              remaining: commitment.remaining,
              envelope: commitment.envelope,
              dueDay: commitment.dueDay,
            })),
            savingsRemaining,
            wantsRemaining: wantsEnvelope?.remainingAmount ?? 0,
            needsRemaining: needsEnvelope?.remainingAmount ?? 0,
            cycleEndDate: activeCycle.endDate,
            currencySymbol: profile.currencySymbol,
          })
        : null;

    const coach = {
      kind: coachPresentation.kind,
      message: coachPresentation.message,
      interactionId: coachPresentation.interactionId as
        | Id<"coachInteractions">
        | undefined,
      options: coachPresentation.options,
      crisisOptions: coachPresentation.crisisOptions,
      crisisPlan: crisisPlan ?? undefined,
      rescueSuggestion: pendingCoach?.rescueSuggestion ?? undefined,
      awaitingRescueConfirmation:
        pendingCoach?.selectedOptionId === "suggest_rescue" &&
        pendingCoach?.rescueSuggestion != null,
    };

    return {
      profile: {
        name: profile.name,
        currencyCode: profile.currencyCode,
        plan: profile.plan,
      },
      cycle: {
        id: activeCycle._id,
        startDate: activeCycle.startDate,
        endDate: activeCycle.endDate,
        needsReview: activeCycle.needsReview ?? false,
        unallocatedCents: activeCycle.unallocatedCents ?? 0,
        ...cycleMetrics,
      },
      hero,
      liquidity: {
        spendableCents: spendable.spendableCents,
        reservedCents: spendable.reservedCents,
        unallocatedCents: spendable.unallocatedCents,
        savingsParkedInEnvelopeCents: spendable.savingsParkedInEnvelopeCents,
      },
      envelopes,
      commitments,
      coach,
      movements,
      isEarlyCycle,
    };
  },
});
