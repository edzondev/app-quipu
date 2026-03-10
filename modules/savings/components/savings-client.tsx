"use client";

import type React from "react";
import { api } from "@/convex/_generated/api";
import { usePlan } from "@/hooks/use-plan";
import { PremiumGate } from "@/core/components/shared/premium-gate";
import { PremiumBadge } from "@/core/components/shared/premium-badge";
import { Card, CardContent } from "@/core/components/ui/card";
import { NewGoalDialog } from "@/modules/savings/components/new-goal-dialog";
import { WithdrawButton } from "@/modules/savings/components/withdraw-button";
import type { Preloaded } from "convex/react";
import { useMutation, usePreloadedQuery } from "convex/react";
import { Shield, Trash, TrendingUp } from "lucide-react";
import { Button } from "@/core/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/core/components/ui/alert-dialog";
import { Id } from "@/convex/_generated/dataModel";

type Props = {
  preloadedSubs: Preloaded<typeof api.savings.getSavingsSubEnvelopes>;
  preloadedGoals: Preloaded<typeof api.savings.getSavingsGoals>;
  preloadedProfile: Preloaded<typeof api.profiles.getMyProfile>;
};

export function SavingsClient({
  preloadedSubs,
  preloadedGoals,
  preloadedProfile,
}: Props) {
  const subEnvelopes = usePreloadedQuery(preloadedSubs);
  const goals = usePreloadedQuery(preloadedGoals);
  const profile = usePreloadedQuery(preloadedProfile);
  const mutation = useMutation(api.savings.deleteSavingsGoal);
  const { isPremium } = usePlan();

  if (!profile || !subEnvelopes) return null;

  const { currencySymbol, currencyLocale } = profile;

  const fmt = (n: number) =>
    `${currencySymbol} ${n.toLocaleString(currencyLocale, { maximumFractionDigits: 0 })}`;

  const totalSaved = subEnvelopes.reduce((s, e) => s + e.currentAmount, 0);

  const emergency = subEnvelopes.find((s) => s.subEnvelopeId === "emergency");
  const investment = subEnvelopes.find((s) => s.subEnvelopeId === "investment");

  const mainSubs = [
    emergency && {
      ...emergency,
      icon: <Shield className="w-5 h-5 text-envelope-savings" />,
    },
    investment && {
      ...investment,
      icon: <TrendingUp className="w-5 h-5 text-envelope-savings" />,
    },
  ].filter(Boolean) as (NonNullable<typeof emergency> & {
    icon: React.ReactNode;
  })[];

  const handleDelete = async (goalId: Id<"savingsGoals">) => {
    await mutation({ goalId });
  };

  return (
    <>
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">Tu Ahorro</h1>
        <p className="text-muted-foreground">
          Total acumulado:{" "}
          <span className="font-bold text-envelope-savings">
            {fmt(totalSaved)}
          </span>
        </p>
      </div>

      {/* Sub-envelopes: emergency + investment */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-10">
        {mainSubs.map((sub, i) => (
          <div
            key={sub._id}
            className="animate-in fade-in slide-in-from-bottom-2 duration-300 fill-mode-both"
            style={{ animationDelay: `${i * 100}ms` }}
          >
            <Card className="h-full">
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {sub.icon}
                    <span className="font-semibold">{sub.label}</span>
                  </div>
                  <span className="text-sm font-bold text-muted-foreground">
                    {Math.round(sub.progress)}%
                  </span>
                </div>
                <div className="w-full h-2.5 rounded-full bg-muted overflow-hidden">
                  <div
                    className="h-full rounded-full bg-envelope-savings transition-all duration-700 ease-out"
                    style={{ width: `${Math.min(sub.progress, 100)}%` }}
                  />
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">
                    {fmt(sub.currentAmount)}
                  </span>
                  <span className="font-medium">
                    Meta: {fmt(sub.goalAmount)}
                  </span>
                </div>
                {sub.subEnvelopeId === "emergency" ? (
                  <WithdrawButton emergencyBalance={sub.currentAmount} />
                ) : null}
              </CardContent>
            </Card>
          </div>
        ))}
      </div>

      {/* Savings goals */}
      <div className="mb-4">
        <h2 className="text-xl font-bold tracking-tight">Mis Objetivos</h2>
        <p className="text-muted-foreground text-sm flex items-center gap-1.5">
          {isPremium ? (
            "Objetivos ilimitados"
          ) : (
            <>
              Máximo 1 objetivo · Desbloquea ilimitados
              <PremiumBadge />
            </>
          )}
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {(goals ?? []).map((goal, i) => (
          <div
            key={goal._id}
            className="animate-in fade-in slide-in-from-bottom-2 duration-300 fill-mode-both"
            style={{ animationDelay: `${i * 80}ms` }}
          >
            <Card>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-2xl">{goal.emoji}</span>
                    <span className="font-semibold truncate">{goal.name}</span>
                  </div>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button
                        variant="ghost"
                        className="hover:bg-destructive text-destructive hover:text-white"
                        size="icon"
                      >
                        <Trash className="w-4 h-4" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Estas seguro?</AlertDialogTitle>
                        <AlertDialogDescription>
                          Deseas eliminar tu objetivo actual?. Esta acción no se
                          puede deshacer.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        <AlertDialogAction
                          variant="destructive"
                          onClick={() => handleDelete(goal._id)}
                        >
                          Continuar
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
                <div className="w-full h-2 rounded-full bg-muted overflow-hidden">
                  <div
                    className="h-full rounded-full bg-envelope-savings transition-all duration-700 ease-out"
                    style={{
                      width: `${Math.min((goal.currentAmount / goal.targetAmount) * 100, 100)}%`,
                    }}
                  />
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">
                    {fmt(goal.currentAmount)}
                  </span>
                  <span className="font-medium">{fmt(goal.targetAmount)}</span>
                </div>
                <p className="text-xs text-muted-foreground">
                  {fmt(goal.monthlyRequired)} / mes · Meta: {goal.deadline}
                </p>
              </CardContent>
            </Card>
          </div>
        ))}

        {!isPremium && (goals ?? []).length >= 1 ? (
          <PremiumGate featureName="Objetivos ilimitados">
            <NewGoalDialog currencySymbol={currencySymbol} />
          </PremiumGate>
        ) : (
          <NewGoalDialog currencySymbol={currencySymbol} />
        )}
      </div>
    </>
  );
}
