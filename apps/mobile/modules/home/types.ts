export type EnvelopeType = "needs" | "wants" | "savings";

export type HomeTone = EnvelopeType;

export type StatusBadge = "stable" | "attention" | "risk" | "starting";

export type Allocations = {
  needs: number;
  wants: number;
  savings: number;
};

export type DashboardEnvelope = {
  type: EnvelopeType;
  remainingAmount: number;
  allocatedAmount: number;
  percentRemaining: number;
};

export type DashboardMovement = {
  id: string;
  kind: "expense" | "income";
  label: string;
  envelopeLabel?: string;
  amount: number;
  timestamp: number;
};

export type DashboardHero = {
  dailyAvailableCents: number;
  displayDailyCents: number;
  rateLine?: string;
  bodyCopy?: string;
  validationCopy?: string;
  statusBadge: StatusBadge;
  spendableCents: number;
  reservedCents: number;
  unallocatedCents: number;
};

export type DashboardCycle = {
  id: string;
  startDate: number;
  endDate: number;
  daysTotal: number;
  daysRemaining: number;
  daysElapsed: number;
  progressPercent: number;
  needsReview?: boolean;
  unallocatedCents?: number;
};

export type DashboardCoach = {
  kind: string;
  message: string;
};

export type DashboardSummary = {
  profile: { name?: string; currencyCode: string; plan: string };
  cycle: DashboardCycle | null;
  hero: DashboardHero | null;
  liquidity?: {
    spendableCents: number;
    reservedCents: number;
    unallocatedCents: number;
    savingsParkedInEnvelopeCents: number;
  };
  envelopes: DashboardEnvelope[];
  commitments: unknown[];
  coach: DashboardCoach | null;
  movements: DashboardMovement[];
  isEarlyCycle: boolean;
};

export type HomeEnvelopeView = {
  type: EnvelopeType;
  label: string;
  cents: number | null;
  suffix: string;
  progress: number;
};

export type HomeMovementView = {
  id: string;
  name: string;
  cents: number;
  kind: "income" | "expense";
  envelopeType: EnvelopeType;
};

export type HomeBadge = {
  label: string;
  tone: StatusBadge;
};

type HomeViewBase = {
  cycleLabel: string;
  heroHint: string;
};

export type EmptyHomeView = HomeViewBase & {
  kind: "empty";
  title: string;
};

export type ActiveHomeView = {
  kind: "active";
  cycleLabel: string;
  badge: HomeBadge;
  heroHint: string;
  envelopes: HomeEnvelopeView[];
  coachMessage: string;
  dailyCents: number;
  daysRemainingLabel: string;
  envelopesTotalCents: number;
  cycleProgress: number;
  movements: HomeMovementView[];
};

export type HomeView = EmptyHomeView | ActiveHomeView;
