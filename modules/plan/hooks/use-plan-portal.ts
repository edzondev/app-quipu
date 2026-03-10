"use client";

import { api } from "@/convex/_generated/api";
import { useQuery, useAction } from "convex/react";
import { useState } from "react";

export function usePlanPortal() {
  const planData = useQuery(api.subscriptions.getMyPlan);
  const createPortalSession = useAction(api.polar.createCustomerPortalSession);

  const [isLoadingPortal, setIsLoadingPortal] = useState(false);
  const [portalError, setPortalError] = useState<string | null>(null);

  const handleOpenPortal = async () => {
    setIsLoadingPortal(true);
    setPortalError(null);
    try {
      const url = await createPortalSession({});
      window.open(url, "_blank", "noopener,noreferrer");
    } catch {
      setPortalError("No se pudo abrir el portal. Intenta de nuevo.");
    } finally {
      setIsLoadingPortal(false);
    }
  };

  const isLoading = planData === undefined;
  const isPremium = planData?.plan === "premium";

  const activatedAt = planData?.planActivatedAt
    ? new Date(planData.planActivatedAt).toLocaleDateString("es", {
        year: "numeric",
        month: "long",
        day: "numeric",
      })
    : null;

  return {
    isLoading,
    isPremium,
    plan: planData?.plan ?? null,
    activatedAt,
    hasPolarCustomer: !!planData?.polarCustomerId,
    isLoadingPortal,
    portalError,
    handleOpenPortal,
  };
}
