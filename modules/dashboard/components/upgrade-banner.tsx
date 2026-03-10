"use client";

import { api } from "@/convex/_generated/api";
import { Button } from "@/core/components/ui/button";
import { useAction, useQuery } from "convex/react";
import { useState } from "react";

export function UpgradeBanner() {
  const plan = useQuery(api.subscriptions.getMyPlan);
  const createPremiumCheckout = useAction(api.polar.createPremiumCheckout);
  const [loading, setLoading] = useState(false);

  if (!plan || plan.plan === "premium") return null;

  const handleUpgrade = async () => {
    setLoading(true);
    try {
      const url = await createPremiumCheckout({
        origin: window.location.origin,
        successUrl: `${window.location.origin}/success`,
      });
      window.location.href = url;
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-2 mb-2 rounded-xl border bg-card p-4 flex flex-col items-center gap-3 text-center shadow-sm">
      <div className="space-y-1">
        <p className="font-semibold text-sm leading-tight">Hazte Premium</p>
        <p className="text-xs text-muted-foreground leading-snug">
          Desbloquea todas las funciones de Quipu.
        </p>
      </div>

      <span className="text-4xl select-none" aria-hidden>
        🚀
      </span>

      <Button
        size="sm"
        className="w-full"
        onClick={handleUpgrade}
        disabled={loading}
      >
        {loading ? "Cargando..." : "Actualizar ahora"}
      </Button>
    </div>
  );
}
