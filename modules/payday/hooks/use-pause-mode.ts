"use client";

import { useMutation } from "convex/react";
import { ConvexError } from "convex/values";
import { useState } from "react";
import { toast } from "sonner";
import { api } from "@/convex/_generated/api";
import { todayString } from "@/lib/utils";

export function usePauseMode() {
  const [isActivating, setIsActivating] = useState(false);
  const [isDeactivating, setIsDeactivating] = useState(false);

  const activatePauseMode = useMutation(api.pauseMode.activatePauseMode);
  const deactivatePauseMode = useMutation(api.pauseMode.deactivatePauseMode);

  const activate = async (liquidation: number, month: string) => {
    setIsActivating(true);
    try {
      await activatePauseMode({ liquidation, month, today: todayString() });
      toast.success("Modo Pausa activado");
    } catch (err) {
      if (err instanceof ConvexError) {
        toast.error(String(err.data));
      } else {
        toast.error("No se pudo activar Modo Pausa.");
      }
      throw err;
    } finally {
      setIsActivating(false);
    }
  };

  const deactivate = async () => {
    setIsDeactivating(true);
    try {
      await deactivatePauseMode();
      toast.success("Modo Pausa desactivado");
    } catch (err) {
      if (err instanceof ConvexError) {
        toast.error(String(err.data));
      } else {
        toast.error("No se pudo desactivar Modo Pausa.");
      }
      throw err;
    } finally {
      setIsDeactivating(false);
    }
  };

  return { activate, deactivate, isActivating, isDeactivating };
}
