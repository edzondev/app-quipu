import { limaStartOfDay } from "../../shared/lib/date";
import { evaluateCycleCompliance } from "./budgetMath";

export const MS_PER_DAY = 24 * 60 * 60 * 1000;
const LIMA_TIMEZONE = "America/Lima";
const LIMA_DATE_PARTS_FORMATTER = new Intl.DateTimeFormat("en-US", {
  timeZone: LIMA_TIMEZONE,
  day: "numeric",
  month: "numeric",
  year: "numeric",
});

export type CycleCompliance = ReturnType<typeof evaluateCycleCompliance>;
export type StatusBadge = "stable" | "attention" | "risk" | "starting";
export type CommitmentCoverage = "covered" | "partial" | "uncovered";
export type CoachKind =
  | "tranquil"
  | "warning"
  | "suggestion"
  | "crisis"
  | "contigo";

export type MovementRecord = {
  id: string;
  kind: "expense" | "income";
  label: string;
  envelopeLabel?: string;
  amount: number;
  timestamp: number;
  isExtraordinaryIncome?: boolean;
  appliedByAutoRule?: boolean;
};

type EnvelopeSlice = {
  type: "needs" | "wants" | "savings";
  remainingAmount: number;
  allocatedAmount: number;
};

type ExpenseSlice = {
  id: string;
  description: string;
  amount: number;
  timestamp: number;
  envelopeType?: "needs" | "wants" | "savings";
};

type IncomeSlice = {
  id: string;
  description: string;
  amount: number;
  occurredAt: number;
  incomeKind?: "habitual" | "extraordinary";
  appliedByAutoRule?: boolean;
};

function getLimaParts(now: number) {
  const parts = LIMA_DATE_PARTS_FORMATTER.formatToParts(new Date(now));

  return {
    day: Number(parts.find((p) => p.type === "day")?.value ?? 1),
    month: Number(parts.find((p) => p.type === "month")?.value ?? 1),
    year: Number(parts.find((p) => p.type === "year")?.value ?? 1970),
  };
}

function daysInMonth(year: number, month: number): number {
  return new Date(Date.UTC(year, month, 0)).getUTCDate();
}

export function computeDailyAvailable(
  wantsRemaining: number,
  daysRemaining: number,
): number {
  return Math.floor(wantsRemaining / Math.max(daysRemaining, 1));
}

export function computeDisplayDailyCents(dailyAvailableCents: number): number {
  return Math.max(0, dailyAvailableCents);
}

export function computeCycleProgress(
  start: number,
  end: number,
  now: number,
): number {
  if (end <= start) return 0;
  const progress = (now - start) / (end - start);
  return Math.min(1, Math.max(0, progress));
}

export function computeCycleDayMetrics(
  start: number,
  end: number,
  now: number,
): {
  daysTotal: number;
  daysRemaining: number;
  daysElapsed: number;
  progressPercent: number;
} {
  // Días calendario en Lima, no bloques de 24h: el ancla del ciclo puede ser
  // media tarde y "Día N" debe coincidir con el conteo del usuario.
  const startDay = limaStartOfDay(start);
  const endDay = limaStartOfDay(end);
  const nowDay = limaStartOfDay(now);
  const daysTotal = Math.max(1, Math.round((endDay - startDay) / MS_PER_DAY));
  const daysElapsed = Math.min(
    daysTotal,
    Math.max(0, Math.round((nowDay - startDay) / MS_PER_DAY) + 1),
  );
  const daysRemaining = Math.max(0, daysTotal - daysElapsed);
  const progressPercent = Math.round(
    computeCycleProgress(start, end, now) * 100,
  );

  return { daysTotal, daysRemaining, daysElapsed, progressPercent };
}

export function detectEarlyCycle(params: {
  expenseCount: number;
  daysElapsed: number;
  movementCount: number;
}): boolean {
  if (params.expenseCount > 0) return false;
  return params.daysElapsed <= 1 || params.movementCount === 0;
}

export function mapComplianceToBadge(compliance: CycleCompliance): StatusBadge {
  switch (compliance) {
    case "compliant":
      return "stable";
    case "warning":
      return "attention";
    case "failed":
      return "risk";
  }
}

export function resolveHeroStatusBadge(
  compliance: CycleCompliance,
  isEarlyCycle: boolean,
): StatusBadge {
  if (isEarlyCycle) return "starting";
  return mapComplianceToBadge(compliance);
}

export function computeCommitmentCoverageMvp(
  amount: number,
  envelopeRemaining: number,
): CommitmentCoverage {
  if (envelopeRemaining >= amount) return "covered";
  if (envelopeRemaining > 0) return "partial";
  return "uncovered";
}

export function daysUntilDueDay(dueDay: number, now: number): number {
  const { day: today, month, year } = getLimaParts(now);
  if (dueDay >= today) return dueDay - today;
  const dim = daysInMonth(year, month);
  return dim - today + dueDay;
}

export function computeEnvelopePercentRemaining(
  remainingAmount: number,
  allocatedAmount: number,
): number {
  if (allocatedAmount <= 0) return 0;
  return Math.round((remainingAmount / allocatedAmount) * 100);
}

export function computeSurplusProjection(envelopes: EnvelopeSlice[]): number {
  return envelopes.reduce(
    (acc, envelope) => acc + Math.max(0, envelope.remainingAmount),
    0,
  );
}

export function buildValidationCopy(statusBadge: StatusBadge): string {
  switch (statusBadge) {
    case "stable":
      return "Vas por buen camino.";
    case "attention":
      return "Vas bien, pero conviene ir con cuidado.";
    case "risk":
      return "Hay presión en tus sobres. Resolvámoslo con calma.";
    case "starting":
      return "";
  }
}

export function buildEarlyCycleHeroBody(): string {
  return "Tu presupuesto ya está repartido en sobres. Registra tu primer gasto cuando llegue.";
}

/**
 * Copy del héroe con unidad explícita: es una tasa diaria, no un saldo.
 * "≈ S/ 47.98 por día. Te quedan S/ 1,919 en sobres para 39 días."
 */
export function buildDailyRateCopy(params: {
  dailyCents: number;
  spendableCents: number;
  daysRemaining: number;
  currencySymbol: string;
}): string {
  const format = (cents: number) =>
    (cents / 100).toLocaleString("es-PE", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  const horizon =
    params.daysRemaining <= 1
      ? "para hoy"
      : `para ${params.daysRemaining} días`;
  return `≈ ${params.currencySymbol} ${format(params.dailyCents)} por día. Te quedan ${params.currencySymbol} ${format(params.spendableCents)} en sobres ${horizon}.`;
}

export function buildEarlyCycleCoachMessage(profileName: string): string {
  return `${profileName}, tu sistema 50/30/20 ya está listo. Cuando registres tu primer gasto, Quipu te mostrará cómo va el ciclo.`;
}

export function buildTranquilCoachMessage(
  profileName: string,
  surplusCents: number,
  currencySymbol = "S/",
): string {
  const amount = (surplusCents / 100).toLocaleString("es-PE", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  return `Vas por buen camino, ${profileName}. A este ritmo cierras el ciclo con ${currencySymbol} ${amount} de sobra.`;
}

export function mergeRecentMovements(
  expenses: ExpenseSlice[],
  incomes: IncomeSlice[],
  limit = 4,
): MovementRecord[] {
  const expenseRows: MovementRecord[] = expenses.map((expense) => ({
    id: expense.id,
    kind: "expense",
    label: expense.description,
    envelopeLabel: expense.envelopeType,
    amount: expense.amount,
    timestamp: expense.timestamp,
  }));

  const incomeRows: MovementRecord[] = incomes.map((income) => ({
    id: income.id,
    kind: "income",
    label: income.description,
    amount: income.amount,
    timestamp: income.occurredAt,
    isExtraordinaryIncome: income.incomeKind === "extraordinary",
    appliedByAutoRule: income.appliedByAutoRule,
  }));

  return [...expenseRows, ...incomeRows]
    .sort((a, b) => b.timestamp - a.timestamp)
    .slice(0, limit);
}

export function sortCommitmentsByDue<T extends { daysUntilDue: number }>(
  commitments: T[],
): T[] {
  return [...commitments].sort((a, b) => a.daysUntilDue - b.daysUntilDue);
}

export { evaluateCycleCompliance };
