"use client";

import { api } from "@/convex/_generated/api";
import { Button } from "@/core/components/ui/button";
import { usePlan } from "@/hooks/use-plan";
import { Crown } from "lucide-react";
import { useAction } from "convex/react";
import { useState } from "react";

type Props = {
  className?: string;
  size?: "sm" | "default" | "lg";
};

export function UpgradeCheckoutButton({ className, size = "default" }: Props) {
  const { isPremium, isLoading } = usePlan();
  const createPremiumCheckout = useAction(api.polar.createPremiumCheckout);
  const [loading, setLoading] = useState(false);

  if (isLoading) return null;

  if (isPremium) {
    return (
      <div className="flex items-center justify-center gap-2 rounded-xl border border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-950/20 px-4 py-3 text-sm font-medium text-amber-700 dark:text-amber-400">
        <Crown className="w-4 h-4" />
        Ya eres Premium 🎉
      </div>
    );
  }

  const handleCheckout = async () => {
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
    <Button
      size={size}
      className={className}
      onClick={handleCheckout}
      disabled={loading}
    >
      {loading ? "Cargando..." : "Obtener Premium"}
    </Button>
  );
}
