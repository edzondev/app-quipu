import { api } from "@quipu/convex-api";
import { useQuery } from "convex/react";
import type {
  Allocations,
  DashboardEnvelope,
  DashboardMovement,
  DashboardSummary,
  EnvelopeType,
  HomeEnvelopeView,
  HomeMovementView,
  HomeView,
  StatusBadge,
} from "./types";

const ENVELOPE_ORDER: EnvelopeType[] = ["needs", "wants", "savings"];

const ENVELOPE_LABEL: Record<EnvelopeType, string> = {
  needs: "Necesidades",
  wants: "Gustos",
  savings: "Ahorro",
};

const BADGE_LABEL: Record<StatusBadge, string> = {
  stable: "Estable",
  attention: "Atención",
  risk: "En riesgo",
  starting: "Recién empiezas",
};

const DEFAULT_HERO_HINT = "Sin tocar tus compromisos ni tu ahorro.";
const DEFAULT_COACH = "Empecemos por tu sueldo. Lo demás se acomoda solo.";
const EMPTY_TITLE = "Empieza con tu primer ingreso.";
const EMPTY_HERO_HINT =
  "Registra cuánto ganas y Quipu lo reparte en tus tres sobres: Necesidades, Gustos y Ahorro.";

const DEFAULT_ALLOCATIONS = { needs: 50, wants: 30, savings: 20 };

const DAY_MONTH_FORMATTER = new Intl.DateTimeFormat("es-PE", {
  day: "numeric",
  month: "short",
  timeZone: "America/Lima",
});

function envelopeTypeFromLabel(label: string | undefined): EnvelopeType {
  if (label === "needs" || label === "Necesidades") return "needs";
  if (label === "wants" || label === "Gustos") return "wants";
  if (label === "savings" || label === "Ahorro") return "savings";
  return "needs";
}

function formatCentsShort(cents: number): string {
  const soles = cents / 100;
  return soles.toLocaleString("es-PE", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  });
}

function mapActiveEnvelope(envelope: DashboardEnvelope): HomeEnvelopeView {
  const isSavings = envelope.type === "savings";
  const displayCents = isSavings
    ? envelope.remainingAmount > 0
      ? envelope.remainingAmount
      : envelope.allocatedAmount
    : Math.max(0, envelope.remainingAmount);

  return {
    type: envelope.type,
    label: ENVELOPE_LABEL[envelope.type],
    cents: displayCents,
    suffix: isSavings
      ? "apartado"
      : `de ${formatCentsShort(envelope.allocatedAmount)}`,
    progress: envelope.percentRemaining,
  };
}

function mapMovement(movement: DashboardMovement): HomeMovementView {
  return {
    id: movement.id,
    name: movement.label,
    cents: movement.amount,
    kind: movement.kind,
    envelopeType: envelopeTypeFromLabel(movement.envelopeLabel),
  };
}

function emptyView(): HomeView {
  return {
    kind: "empty",
    cycleLabel: "Sin ciclo activo",
    title: EMPTY_TITLE,
    heroHint: EMPTY_HERO_HINT,
  };
}

function cycleLine(daysElapsed: number, daysTotal: number): string {
  return `Ciclo · Día ${daysElapsed} / ${daysTotal}`;
}

function remainingLine(daysRemaining: number, endDate: number): string {
  return `${daysRemaining} días · termina ${DAY_MONTH_FORMATTER.format(new Date(endDate))}`;
}

export function toHomeView(
  summary: DashboardSummary | null | undefined,
  allocations: Allocations,
): HomeView {
  if (!summary?.cycle || !summary.hero) {
    return emptyView();
  }

  const { cycle, hero } = summary;
  const spendableCents =
    summary.liquidity?.spendableCents ?? hero.spendableCents;

  return {
    kind: "active",
    cycleLabel: cycleLine(cycle.daysElapsed, cycle.daysTotal),
    badge: {
      label: BADGE_LABEL[hero.statusBadge],
      tone: hero.statusBadge,
    },
    dailyCents: hero.displayDailyCents,
    heroHint:
      hero.bodyCopy ??
      hero.rateLine ??
      hero.validationCopy ??
      DEFAULT_HERO_HINT,
    daysRemainingLabel: remainingLine(cycle.daysRemaining, cycle.endDate),
    envelopesTotalCents: spendableCents,
    cycleProgress: cycle.progressPercent,
    envelopes: ENVELOPE_ORDER.map((type) => {
      const found = summary.envelopes.find(
        (envelope) => envelope.type === type,
      );
      return found
        ? mapActiveEnvelope(found)
        : {
            type,
            label: ENVELOPE_LABEL[type],
            cents: null,
            suffix: `${allocations[type]}%`,
            progress: 0,
          };
    }),
    coachMessage: summary.coach?.message ?? DEFAULT_COACH,
    movements: summary.movements.map(mapMovement),
  };
}

export function useHomeSummary(): HomeView {
  const summary = useQuery(api.dashboard.getSummary, {});
  const profile = useQuery(api.profiles.getMyProfile, {});

  return toHomeView(summary as DashboardSummary | null | undefined, {
    needs: profile?.allocationNeeds ?? DEFAULT_ALLOCATIONS.needs,
    wants: profile?.allocationWants ?? DEFAULT_ALLOCATIONS.wants,
    savings: profile?.allocationSavings ?? DEFAULT_ALLOCATIONS.savings,
  });
}
