"use client";

import { useMutation, useQuery } from "convex/react";
import type { FunctionReturnType } from "convex/server";
import { useRouter } from "next/navigation";
import {
  type Dispatch,
  type SetStateAction,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { AnalyticsEvents, track } from "@/core/analytics";
import { fromConvexError } from "@/core/errors";
import { Button } from "@/shared/components/ui/button";
import { formatCents, parseToCents } from "@/shared/lib/money";
import { withPending } from "@/shared/lib/with-pending";
import {
  type Allocation,
  buildSimpleCorrectionPlan,
  computeFreeCents,
  type EnvelopeTargets,
  proposeRemainingByEnvelope,
  type SimpleCorrectionResult,
} from "../lib/simple-correction-plan";
import {
  type SimpleCorrectionWizardValues,
  simpleCorrectionWizardSchema,
} from "../lib/simple-correction-schema";
import { CycleCorrectViewSkeleton } from "./cycle-correct-view-skeleton";
import { WizardStepIncome } from "./wizard-step-income";
import { WizardStepReserved } from "./wizard-step-reserved";
import { WizardStepSplit } from "./wizard-step-split";

type Mode = SimpleCorrectionWizardValues["reservedMode"];
type NewCommitment = NonNullable<SimpleCorrectionWizardValues["newCommitment"]>;

const EMPTY_NEW_COMMITMENT: NewCommitment = {
  name: "",
  amountCents: 0,
  dueDay: 1,
  envelope: "needs",
};

const FALLBACK_ALLOCATION: Allocation = { needs: 50, wants: 30, savings: 20 };

type DashboardSummary = NonNullable<
  FunctionReturnType<typeof api.dashboard.getSummary>
>;
type SettingsOverview = NonNullable<
  FunctionReturnType<typeof api.settings.getSettingsOverview>
>;

function spentPerEnvelopeFrom(
  summary: DashboardSummary | null | undefined,
): EnvelopeTargets {
  const envelopes = summary?.envelopes ?? [];
  const spent = (type: "needs" | "wants" | "savings") => {
    const envelope = envelopes.find((item) => item.type === type);
    if (!envelope) return 0;
    return Math.max(
      0,
      (envelope.allocatedAmount ?? 0) - (envelope.remainingAmount ?? 0),
    );
  };
  return {
    needs: spent("needs"),
    wants: spent("wants"),
    savings: spent("savings"),
  };
}

function reservedBuckets(mode: Mode, reservedCents: number) {
  return {
    reservedWithCommitmentCents:
      mode === "existing" || mode === "create" ? reservedCents : 0,
    reservedGenericCents: mode === "generic" ? reservedCents : 0,
  };
}

function MissingActiveCycle() {
  return (
    <section className="mx-auto max-w-lg px-4 py-8">
      <h1 className="font-serif text-2xl text-ink">Corregir distribución</h1>
      <p className="mt-2 text-sm text-mute">
        Necesitas un ciclo activo para corregir cómo está repartido tu dinero.
      </p>
    </section>
  );
}

function MissingRegisteredIncome() {
  const router = useRouter();
  return (
    <section className="mx-auto max-w-lg px-4 py-8">
      <h2 className="font-serif text-xl text-ink">
        Aún no registras tu ingreso de este ciclo
      </h2>
      <p className="mt-2 text-sm text-mute">
        Para corregir cómo está repartido tu dinero, primero registra lo que
        entró.
      </p>
      <Button className="mt-4" onClick={() => router.push("/income/register")}>
        Registrar ingreso
      </Button>
    </section>
  );
}

async function submitSimpleCorrection(input: {
  createCommitment: (args: {
    name: string;
    amount: number;
    envelope: "needs" | "wants";
    dueDay: number;
  }) => Promise<string>;
  correct: (args: {
    setEnvelopeRemaining: EnvelopeTargets;
    setUnallocatedCents: number;
    declaredLiquidCents: number;
    reserveToCommitments: Array<{
      commitmentId: Id<"fixedCommitments">;
      amountCents: number;
    }>;
    contributeToSavings: [];
    note: string;
  }) => Promise<unknown>;
  incomeCents: number;
  reservedMode: Mode;
  commitmentId: string;
  newCommitment: NewCommitment;
  reservedWithCommitmentCents: number;
  reservedGenericCents: number;
  allocation: Allocation;
  spentPerEnvelope: EnvelopeTargets;
  targets: EnvelopeTargets;
}): Promise<string | null> {
  let effectiveCommitmentId = input.commitmentId;
  if (input.reservedMode === "create") {
    try {
      effectiveCommitmentId = await input.createCommitment({
        name: input.newCommitment.name,
        amount: input.newCommitment.amountCents,
        envelope: input.newCommitment.envelope,
        dueDay: input.newCommitment.dueDay,
      });
    } catch (error) {
      return fromConvexError(error).message;
    }
  }

  let plan: SimpleCorrectionResult;
  try {
    plan = buildSimpleCorrectionPlan({
      incomeCents: input.incomeCents,
      reservedWithCommitmentCents: input.reservedWithCommitmentCents,
      reservedGenericCents: input.reservedGenericCents,
      commitmentId: effectiveCommitmentId,
      allocation: input.allocation,
      spentPerEnvelope: input.spentPerEnvelope,
      targets: input.targets,
    });
  } catch (error) {
    return error instanceof Error ? error.message : "No se pudo armar el plan.";
  }

  try {
    await input.correct({
      setEnvelopeRemaining: plan.remainingByEnvelope,
      setUnallocatedCents: plan.unallocatedCents,
      declaredLiquidCents: plan.declaredLiquidCents,
      reserveToCommitments: plan.reserveToCommitments.map((row) => ({
        commitmentId: row.commitmentId as Id<"fixedCommitments">,
        amountCents: row.amountCents,
      })),
      contributeToSavings: [],
      note: "Corrección guiada del ciclo",
    });
  } catch (error) {
    return fromConvexError(error).message;
  }

  return null;
}

export function CycleCorrectWizard() {
  const summary = useQuery(api.dashboard.getSummary, {});
  const settings = useQuery(api.settings.getSettingsOverview, {});
  const registeredIncomeCents = useQuery(
    api.cycleCorrection.getRegisteredCycleIncome,
    {},
  );

  if (summary === undefined || settings === undefined) {
    return <CycleCorrectViewSkeleton />;
  }
  if (summary === null || !summary.cycle) {
    return <MissingActiveCycle />;
  }
  if (registeredIncomeCents === 0) {
    return <MissingRegisteredIncome />;
  }

  return (
    <CycleCorrectWizardForm
      summary={summary}
      settings={settings}
      registeredIncomeCents={registeredIncomeCents}
      activeCycle={summary.cycle}
    />
  );
}

function CycleCorrectWizardForm({
  summary,
  settings,
  registeredIncomeCents,
  activeCycle,
}: {
  summary: DashboardSummary;
  settings: SettingsOverview | null;
  registeredIncomeCents: number | undefined;
  activeCycle: NonNullable<DashboardSummary["cycle"]>;
}) {
  const router = useRouter();
  const correct = useMutation(api.cycleCorrection.correctActiveCycleAllocation);
  const createCommitment = useMutation(
    api.fixedCommitments.createFixedCommitment,
  );

  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [incomeText, setIncomeText] = useState("");
  const [reservedText, setReservedText] = useState("");
  const [reservedMode, setReservedMode] = useState<Mode>("none");
  const [commitmentId, setCommitmentId] = useState("");
  const [newCommitment, setNewCommitment] =
    useState<NewCommitment>(EMPTY_NEW_COMMITMENT);
  const [targets, setTargets] = useState<EnvelopeTargets>({
    needs: 0,
    wants: 0,
    savings: 0,
  });
  const [serverError, setServerError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [mismatchConfirmed, setMismatchConfirmed] = useState(false);
  const startedTracked = useRef(false);

  useEffect(() => {
    if (!summary?.cycle || startedTracked.current) return;
    startedTracked.current = true;
    track(AnalyticsEvents.ALLOCATION_CORRECT_STARTED, {
      cycle_id: summary.cycle.id,
      needs_review: summary.cycle.needsReview === true,
    });
  }, [summary]);

  const currencyCode = summary?.profile.currencyCode ?? "PEN";
  const allocation = useMemo<Allocation>(
    () => settings?.allocations ?? FALLBACK_ALLOCATION,
    [settings],
  );

  const incomeCents = parseToCents(incomeText) ?? 0;
  const reservedCents = parseToCents(reservedText) ?? 0;
  const mismatch =
    incomeCents > 0 &&
    registeredIncomeCents !== undefined &&
    incomeCents !== registeredIncomeCents;

  const spentPerEnvelope = useMemo(
    () => spentPerEnvelopeFrom(summary),
    [summary],
  );
  const { reservedWithCommitmentCents, reservedGenericCents } = reservedBuckets(
    reservedMode,
    reservedCents,
  );
  const freeCents = computeFreeCents({
    incomeCents,
    reservedWithCommitmentCents,
    reservedGenericCents,
  });

  function startStep3() {
    setTargets(
      proposeRemainingByEnvelope({
        freeCents,
        allocation,
        spentPerEnvelope,
      }),
    );
    setStep(3);
  }

  function resetProposal() {
    setTargets(
      proposeRemainingByEnvelope({ freeCents, allocation, spentPerEnvelope }),
    );
  }

  async function apply() {
    setServerError(null);
    const parsed = simpleCorrectionWizardSchema.safeParse({
      incomeCents,
      reservedMode,
      reservedCents,
      commitmentId: commitmentId || undefined,
      newCommitment: reservedMode === "create" ? newCommitment : undefined,
      targets,
    });
    if (!parsed.success) {
      setServerError(parsed.error.issues[0]?.message ?? "Revisa los datos.");
      return;
    }
    await withPending(setSaving, async () => {
      const errorMessage = await submitSimpleCorrection({
        createCommitment,
        correct,
        incomeCents,
        reservedMode,
        commitmentId,
        newCommitment,
        reservedWithCommitmentCents,
        reservedGenericCents,
        allocation,
        spentPerEnvelope,
        targets,
      });
      if (errorMessage) {
        setServerError(errorMessage);
        return;
      }
      track(AnalyticsEvents.ALLOCATION_CORRECT_COMPLETED, {
        cycle_id: activeCycle.id,
        needs_review_before: activeCycle.needsReview === true,
      });
      router.push("/dashboard");
    });
  }

  const assigned = targets.needs + targets.wants + targets.savings;
  const spentCents =
    spentPerEnvelope.needs + spentPerEnvelope.wants + spentPerEnvelope.savings;
  const maxDistributable = incomeCents - spentCents;
  const capExceeded =
    reservedWithCommitmentCents + reservedGenericCents + assigned >
    maxDistributable;

  return (
    <CycleCorrectSteps
      step={step}
      incomeText={incomeText}
      currencyCode={currencyCode}
      setIncomeText={setIncomeText}
      setMismatchConfirmed={setMismatchConfirmed}
      setStep={setStep}
      registeredIncomeCents={registeredIncomeCents}
      mismatch={mismatch}
      mismatchConfirmed={mismatchConfirmed}
      incomeCents={incomeCents}
      spentCents={spentCents}
      reservedText={reservedText}
      reservedMode={reservedMode}
      commitmentId={commitmentId}
      newCommitment={newCommitment}
      summary={summary}
      setReservedText={setReservedText}
      setReservedMode={setReservedMode}
      setCommitmentId={setCommitmentId}
      setNewCommitment={setNewCommitment}
      reservedCents={reservedCents}
      startStep3={startStep3}
      freeCents={freeCents}
      targets={targets}
      saving={saving}
      capExceeded={capExceeded}
      setTargets={setTargets}
      resetProposal={resetProposal}
      apply={apply}
      maxDistributable={maxDistributable}
      serverError={serverError}
    />
  );
}

function CycleCorrectSteps({
  step,
  incomeText,
  currencyCode,
  setIncomeText,
  setMismatchConfirmed,
  setStep,
  registeredIncomeCents,
  mismatch,
  mismatchConfirmed,
  incomeCents,
  spentCents,
  reservedText,
  reservedMode,
  commitmentId,
  newCommitment,
  summary,
  setReservedText,
  setReservedMode,
  setCommitmentId,
  setNewCommitment,
  reservedCents,
  startStep3,
  freeCents,
  targets,
  saving,
  capExceeded,
  setTargets,
  resetProposal,
  apply,
  maxDistributable,
  serverError,
}: {
  step: 1 | 2 | 3;
  incomeText: string;
  currencyCode: string;
  setIncomeText: (value: string) => void;
  setMismatchConfirmed: (value: boolean) => void;
  setStep: (step: 1 | 2 | 3) => void;
  registeredIncomeCents: number | undefined;
  mismatch: boolean;
  mismatchConfirmed: boolean;
  incomeCents: number;
  spentCents: number;
  reservedText: string;
  reservedMode: Mode;
  commitmentId: string;
  newCommitment: NewCommitment;
  summary: DashboardSummary;
  setReservedText: (value: string) => void;
  setReservedMode: (mode: Mode) => void;
  setCommitmentId: (id: string) => void;
  setNewCommitment: Dispatch<SetStateAction<NewCommitment>>;
  reservedCents: number;
  startStep3: () => void;
  freeCents: number;
  targets: EnvelopeTargets;
  saving: boolean;
  capExceeded: boolean;
  setTargets: Dispatch<SetStateAction<EnvelopeTargets>>;
  resetProposal: () => void;
  apply: () => void;
  maxDistributable: number;
  serverError: string | null;
}) {
  return (
    <section className="mx-auto max-w-lg px-4 py-8">
      {step === 1 ? (
        <WizardStepIncome
          amountText={incomeText}
          currencyCode={currencyCode}
          onAmountChange={(value) => {
            setIncomeText(value);
            setMismatchConfirmed(false);
          }}
          onNext={() => setStep(2)}
          registeredIncomeCents={registeredIncomeCents}
          mismatch={mismatch}
          mismatchConfirmed={mismatchConfirmed}
          onMismatchConfirmedChange={setMismatchConfirmed}
        />
      ) : null}
      {step === 2 ? (
        <WizardStepReserved
          incomeCents={incomeCents}
          spentCents={spentCents}
          reservedText={reservedText}
          reservedMode={reservedMode}
          commitmentId={commitmentId}
          newCommitment={newCommitment}
          commitments={(summary.commitments ?? []).map((c) => ({
            id: c.id,
            name: c.name,
            amount: c.amount,
          }))}
          currencyCode={currencyCode}
          onReservedChange={setReservedText}
          onModeChange={setReservedMode}
          onCommitmentChange={setCommitmentId}
          onNewCommitmentChange={setNewCommitment}
          onBack={() => setStep(1)}
          onNext={() => {
            setNewCommitment((current) => ({
              ...current,
              amountCents: reservedCents,
            }));
            startStep3();
          }}
        />
      ) : null}
      {step === 3 && mismatch && registeredIncomeCents !== undefined ? (
        <p className="mb-2 text-[12px] text-mute">
          {`Quipu tenía ${formatCents(registeredIncomeCents, { currency: currencyCode })} · Ajuste ${incomeCents > registeredIncomeCents ? "+" : "−"}${formatCents(Math.abs(incomeCents - registeredIncomeCents), { currency: currencyCode })}.`}
        </p>
      ) : null}
      {step === 3 ? (
        <WizardStepSplit
          freeCents={freeCents}
          targets={targets}
          currencyCode={currencyCode}
          spentCents={spentCents}
          disabled={saving || capExceeded}
          onTargetChange={(key, cents) =>
            setTargets((current) => ({ ...current, [key]: cents }))
          }
          onResetProposal={resetProposal}
          onBack={() => setStep(2)}
          onSubmit={apply}
        />
      ) : null}
      {step === 3 && capExceeded ? (
        <p className="mt-2 text-[12px] text-danger-ink">
          {`Solo tienes ${formatCents(maxDistributable, { currency: currencyCode })} disponibles (${formatCents(incomeCents, { currency: currencyCode })} que entraron − ${formatCents(spentCents, { currency: currencyCode })} ya gastados). Ajusta los sobres o el monto apartado.`}
        </p>
      ) : null}
      {serverError ? (
        <p className="mt-2 text-sm text-danger-ink">{serverError}</p>
      ) : null}
    </section>
  );
}
