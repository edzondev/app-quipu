import type { ExpenseEnvelopeType } from "./lib/envelopeSuggestion";

export type ExpenseRegisterVariant = "fab" | "envelope";

export type ExpenseRegisterOpenOptions = {
  variant?: ExpenseRegisterVariant;
  preselectedEnvelope?: ExpenseEnvelopeType;
};

export type ExpenseRegisterResult = {
  expenseId: string;
  envelopeType: ExpenseEnvelopeType;
  amount: number;
  remainingAmount: number;
  spendableCents: number;
  dailyBeforeCents: number;
  dailyAfterCents: number;
  dailyDeltaCents: number;
  daysRemainingInCycle: number;
};

export type ExpenseFlowStep = "amount" | "envelope" | "success";

export type ExpenseFlowState = {
  variant: ExpenseRegisterVariant;
  step: ExpenseFlowStep;
  amountCents: number;
  selectedEnvelope: ExpenseEnvelopeType;
  description: string;
  preselectedEnvelope?: ExpenseEnvelopeType;
  startedAt: number;
  result?: ExpenseRegisterResult;
};
