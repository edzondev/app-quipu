import { marketFromCurrencyCode } from "@/shared/lib/onboarding/markets";

export type HomeTone = "needs" | "wants" | "savings" | "income";
export type BadgeTone = "stable" | "attention" | "risk" | "starting";

export type HomeEnvelope = {
  label: string;
  spent: number;
  total: number;
  progress: number;
  tone: "needs" | "wants" | "savings";
  suffix: string;
};

export type HomeMovement = {
  id: string;
  name: string;
  amount: number;
  tone: HomeTone;
};

export type HomeModel = {
  cycleLabel: string;
  cycleDay: number;
  cycleTotal: number;
  daysLeft: number;
  cycleProgress: number;
  badgeLabel: string;
  badgeTone: BadgeTone;
  dailySoles: number;
  heroSubtitle: string;
  currencySymbol: string;
  envelopes: HomeEnvelope[];
  envelopesBalanceSoles: number;
  coachMessage: string | null;
  todayMovements: HomeMovement[];
};

type EnvelopeSlice = {
  type: "needs" | "wants" | "savings";
  allocatedAmount: number;
  remainingAmount: number;
  percentRemaining: number;
};

export type DashboardHomeInput = {
  profile: { name: string; currencyCode: string };
  cycle: {
    startDate: number;
    daysTotal: number;
    daysRemaining: number;
    daysElapsed: number;
    progressPercent: number;
  } | null;
  hero: {
    displayDailyCents: number;
    statusBadge: BadgeTone;
    bodyCopy?: string;
  } | null;
  envelopes: EnvelopeSlice[];
  coach: { message: string } | null;
  movements: Array<{
    id: string;
    kind: "expense" | "income";
    label: string;
    amount: number;
    timestamp: number;
    envelopeLabel?: string;
  }>;
};

const ENVELOPE_LABEL = {
  needs: "Necesidades",
  wants: "Gustos",
  savings: "Ahorro",
} as const;

const BADGE_LABEL: Record<BadgeTone, string> = {
  stable: "Estable",
  attention: "Atención",
  risk: "En riesgo",
  starting: "Recién empiezas",
};

const TONE_BY_ENVELOPE_LABEL: Record<string, HomeTone> = {
  Necesidades: "needs",
  Gustos: "wants",
  Ahorro: "savings",
};

const DEFAULT_HERO_SUBTITLE = "Sin tocar tus compromisos ni tu ahorro.";
const LIMA = "America/Lima";

export function mapDashboardHome(
  summary: DashboardHomeInput,
  now: number,
): HomeModel | null {
  if (!summary.cycle || !summary.hero) return null;

  const envelopes = summary.envelopes.map(mapEnvelopeRow);
  const symbol =
    marketFromCurrencyCode(summary.profile.currencyCode)?.currencySymbol ??
    "S/";

  return {
    cycleLabel: cycleLabel(summary.cycle.startDate),
    cycleDay: summary.cycle.daysElapsed,
    cycleTotal: summary.cycle.daysTotal,
    daysLeft: summary.cycle.daysRemaining,
    cycleProgress: summary.cycle.progressPercent,
    badgeLabel: BADGE_LABEL[summary.hero.statusBadge],
    badgeTone: summary.hero.statusBadge,
    dailySoles: summary.hero.displayDailyCents / 100,
    heroSubtitle: summary.hero.bodyCopy?.trim() || DEFAULT_HERO_SUBTITLE,
    currencySymbol: symbol,
    envelopes,
    envelopesBalanceSoles: envelopes.reduce(
      (acc, envelope) =>
        acc +
        (envelope.tone === "savings"
          ? envelope.total
          : envelope.total - envelope.spent),
      0,
    ),
    coachMessage: summary.coach?.message ?? null,
    todayMovements: summary.movements
      .filter((movement) => isSameLimaDay(movement.timestamp, now))
      .map((movement) => ({
        id: movement.id,
        name: movement.label,
        amount: movement.amount / 100,
        tone: movementTone(movement.kind, movement.envelopeLabel),
      })),
  };
}

export function mapEnvelopeRow(envelope: EnvelopeSlice): HomeEnvelope {
  if (envelope.type === "savings") {
    const apartados = envelope.allocatedAmount / 100;
    return {
      label: ENVELOPE_LABEL.savings,
      spent: apartados,
      total: apartados,
      progress: envelope.allocatedAmount > 0 ? 100 : 0,
      tone: "savings",
      suffix: "apartado",
    };
  }

  const spentCents = Math.max(
    0,
    envelope.allocatedAmount - envelope.remainingAmount,
  );
  const progress =
    envelope.allocatedAmount > 0
      ? Math.min(100, Math.round((spentCents / envelope.allocatedAmount) * 100))
      : 0;

  return {
    label: ENVELOPE_LABEL[envelope.type],
    spent: spentCents / 100,
    total: envelope.allocatedAmount / 100,
    progress,
    tone: envelope.type,
    suffix: `de ${formatGroupedSoles(envelope.allocatedAmount)}`,
  };
}

function cycleLabel(startDate: number): string {
  const month = new Intl.DateTimeFormat("es-PE", {
    month: "long",
    timeZone: LIMA,
  })
    .format(new Date(startDate))
    .toLocaleLowerCase("es-PE");
  return `Ciclo ${month}`;
}

function movementTone(
  kind: "expense" | "income",
  envelopeLabel?: string,
): HomeTone {
  if (kind !== "expense") return "income";
  return (envelopeLabel && TONE_BY_ENVELOPE_LABEL[envelopeLabel]) || "income";
}

function isSameLimaDay(a: number, b: number): boolean {
  const format = new Intl.DateTimeFormat("en-CA", {
    timeZone: LIMA,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
  return format.format(a) === format.format(b);
}

function formatGroupedSoles(cents: number): string {
  const negative = cents < 0;
  const abs = Math.abs(cents);
  const whole = Math.floor(abs / 100);
  const fraction = abs % 100;
  const grouped = whole.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  const body =
    fraction === 0
      ? grouped
      : `${grouped}.${String(fraction).padStart(2, "0")}`;
  return negative ? `-${body}` : body;
}
