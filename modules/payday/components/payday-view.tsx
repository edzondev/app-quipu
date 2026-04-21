"use client";

import { type Preloaded, usePreloadedQuery, useQuery } from "convex/react";
import { CirclePause, InfoIcon } from "lucide-react";
import { useFeatureFlagEnabled } from "posthog-js/react";
import { useEffect, useState } from "react";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from "@/core/components/ui/alert";
import { Skeleton } from "@/core/components/ui/skeleton";
import { usePayday } from "../hooks/use-payday";
import AssigningStep from "./assigning-step";
import { AssignmentCard } from "./assignment-card";
import DoneStep from "./done-step";
import { MisIngresosCard } from "./mis-ingresos-card";
import { PauseModeActiveCard } from "./pause-mode-active-card";

type Props = {
  preloadedPaydayStatus: Preloaded<typeof api.payday.getPaydayStatus>;
};

type PaydayStatusSnapshot = {
  isPayday: boolean;
  hasProcessedCurrentPayday: boolean;
  nextPaydayDate: string;
  daysUntilNextPayday: number;
  profile: {
    currencySymbol: string;
    monthlyIncome: number;
    allocationNeeds: number;
    allocationWants: number;
    allocationSavings: number;
    payFrequency: "monthly" | "biweekly";
    paydays: number[];
  };
};

type ExtraIncome = {
  _id: Id<"extraIncomes">;
  name: string;
  amount: number;
  includeInBudget: boolean;
};

export default function PaydayView({ preloadedPaydayStatus }: Props) {
  const status = usePreloadedQuery(preloadedPaydayStatus);
  const { step, handleAssign } = usePayday();
  const extraIncomes = useQuery(api.extraIncomes.listExtraIncomes);
  const pauseStatus = useQuery(api.pauseMode.getPauseStatus);

  if (!status || extraIncomes === undefined || pauseStatus === undefined) {
    return (
      <output
        className="flex flex-col items-center justify-center gap-8 py-20"
        aria-live="polite"
        aria-busy="true"
        aria-label="Cargando día de pago"
      >
        <Skeleton className="size-20 shrink-0 rounded-full" />
        <div className="mx-auto w-full max-w-md space-y-3 text-center">
          <Skeleton className="mx-auto h-9 w-56 rounded-md sm:w-64" />
          <Skeleton className="mx-auto h-5 w-full rounded-md" />
          <Skeleton className="mx-auto hidden h-5 w-[88%] rounded-md sm:block" />
        </div>
        <Skeleton className="h-11 w-48 rounded-lg" />
      </output>
    );
  }

  if (pauseStatus?.active) {
    return (
      <section className="animate-in fade-in duration-200 space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Día de pago</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Gestiona tus ingresos y asigna tu dinero
          </p>
        </div>
        <div className="max-w-md">
          <PauseModeActiveCard
            currencySymbol={pauseStatus.currencySymbol}
            fund={pauseStatus.fund}
            spent={pauseStatus.spent}
            remaining={pauseStatus.remaining}
            startedAt={pauseStatus.startedAt}
          />
        </div>
      </section>
    );
  }

  return (
    <PaydayContent
      status={status}
      step={step}
      handleAssign={handleAssign}
      extraIncomes={extraIncomes}
    />
  );
}

function PaydayContent({
  status,
  step,
  handleAssign,
  extraIncomes,
}: {
  status: PaydayStatusSnapshot;
  step: ReturnType<typeof usePayday>["step"];
  handleAssign: ReturnType<typeof usePayday>["handleAssign"];
  extraIncomes: ExtraIncome[];
}) {
  const [isMounted, setIsMounted] = useState(false);
  const showExtraIncomeAlert = useFeatureFlagEnabled("show-extra-income-alert");
  const showPauseModeAlert = useFeatureFlagEnabled("show-pause-mode-alert");

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const {
    isPayday,
    hasProcessedCurrentPayday,
    nextPaydayDate,
    daysUntilNextPayday,
    profile,
  } = status;

  const {
    currencySymbol,
    monthlyIncome,
    allocationNeeds,
    allocationWants,
    allocationSavings,
    payFrequency,
  } = profile;

  const extraIncomesTotal = extraIncomes
    .filter((e) => e.includeInBudget)
    .reduce((sum, e) => sum + e.amount, 0);
  const totalAssignable = monthlyIncome + extraIncomesTotal;

  // Full-screen animation states — shown regardless of idle sub-state
  if (step === "assigning") {
    return (
      <section className="animate-in fade-in duration-200">
        <AssigningStep
          currencySymbol={currencySymbol}
          monthlyIncome={totalAssignable}
          allocationNeeds={allocationNeeds}
          allocationWants={allocationWants}
          allocationSavings={allocationSavings}
        />
      </section>
    );
  }

  if (step === "done") {
    return (
      <section className="animate-in fade-in duration-200">
        <DoneStep />
      </section>
    );
  }

  // step === "idle": two-column layout
  return (
    <section className="animate-in fade-in duration-200 space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Día de pago</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Gestiona tus ingresos y asigna tu dinero
        </p>
      </div>

      <div className="space-y-3">
        {isMounted && showExtraIncomeAlert && (
          <>
            <Alert
              variant="default"
              className="mb-4 rounded-xl border-transparent bg-white dark:bg-zinc-900 px-3 py-3 shadow-sm"
            >
              <InfoIcon className="mt-0.5 size-6" color="#ffffff" fill="#8200db" />
              <AlertTitle className="text-sm font-medium tracking-tight text-purple-700">
                Nuevos funcionalidades para tu día de pago
              </AlertTitle>
              <AlertDescription className="mt-1 text-[13px] leading-relaxed text-gray-500">
                <ul className="list-disc list-inside">
                  <li>Ahora puedes agregar ingresos extra a tu presupuesto y decidir si deben entrar en tu asignación mensual.</li>
                  <li>Si te quedaste sin ingresos fijos, activa Modo Pausa para cuidar tu fondo mientras encuentras una nueva fuente de ingreso.</li>
                </ul>
              </AlertDescription>
            </Alert>
          </>
        )}

        {isMounted && showPauseModeAlert && (
          <Alert
            variant="default"
            className="rounded-xl border-orange-300/55 bg-orange-50 px-3 py-3 shadow-none"
          >
            <CirclePause className="mt-0.5 size-4 text-orange-600/75" />
            <AlertTitle className="text-sm font-medium tracking-tight text-orange-950/80">
              ¿Te quedaste sin trabajo? Activa Modo Pausa
            </AlertTitle>
            <AlertDescription className="mt-1 text-[13px] leading-relaxed text-orange-900/65">
              Si te quedaste sin ingresos fijos, activa Modo Pausa para cuidar
              tu fondo mientras encuentras una nueva fuente de ingreso.
            </AlertDescription>
          </Alert>
        )}
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2 items-start">
        <MisIngresosCard
          currencySymbol={currencySymbol}
          monthlyIncome={monthlyIncome}
          extraIncomes={extraIncomes}
          totalAssignable={totalAssignable}
        />
        <AssignmentCard
          currencySymbol={currencySymbol}
          totalAssignable={totalAssignable}
          isPayday={isPayday}
          hasProcessedCurrentPayday={hasProcessedCurrentPayday}
          nextPaydayDate={nextPaydayDate}
          daysUntilNextPayday={daysUntilNextPayday}
          payFrequency={payFrequency}
          onAssign={handleAssign}
          isAssigning={false}
        />
      </div>
    </section>
  );
}
