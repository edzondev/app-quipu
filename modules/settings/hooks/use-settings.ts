"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { usePreloadedQuery } from "convex/react";
import { useMutation, useQuery } from "convex/react";
import { ConvexError } from "convex/values";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { api } from "@/convex/_generated/api";
import type { Preloaded } from "convex/react";
import {
  type SettingsFormValues,
  settingsSchema,
} from "../schemas/settings.schema";

export function useSettings(
  preloaded: Preloaded<typeof api.profiles.getMyProfile>,
) {
  const [isLoading, setIsLoading] = useState(false);
  const profile = usePreloadedQuery(preloaded);
  const commitments = useQuery(api.fixedCommitments.listFixedCommitments);

  const updateProfile = useMutation(api.profiles.updateProfile);
  const deleteCommitment = useMutation(
    api.fixedCommitments.deleteFixedCommitment,
  );

  const form = useForm<SettingsFormValues>({
    resolver: zodResolver(settingsSchema),
    defaultValues: {
      monthlyIncome: profile?.monthlyIncome ?? 0,
      payFrequency: profile?.payFrequency ?? "monthly",
      allocationNeeds: profile?.allocationNeeds ?? 50,
      allocationWants: profile?.allocationWants ?? 30,
      allocationSavings: profile?.allocationSavings ?? 20,
      coupleModeEnabled: profile?.coupleModeEnabled ?? false,
      couplePartnerName: profile?.couplePartnerName ?? "",
      coupleMonthlyBudget: profile?.coupleMonthlyBudget ?? 0,
    },
  });

  // Re-sync form when the Convex profile updates reactively (e.g. after a
  // successful save or an external change). react-hook-form only reads
  // defaultValues once on mount, so we must call reset() explicitly.
  useEffect(() => {
    if (!profile) return;
    form.reset({
      monthlyIncome: profile.monthlyIncome,
      payFrequency: profile.payFrequency ?? "monthly",
      allocationNeeds: profile.allocationNeeds,
      allocationWants: profile.allocationWants,
      allocationSavings: profile.allocationSavings,
      coupleModeEnabled: profile.coupleModeEnabled,
      couplePartnerName: profile.couplePartnerName ?? "",
      coupleMonthlyBudget: profile.coupleMonthlyBudget ?? 0,
    });
  }, [
    profile?.monthlyIncome,
    profile?.payFrequency,
    profile?.allocationNeeds,
    profile?.allocationWants,
    profile?.allocationSavings,
    profile?.coupleModeEnabled,
    profile?.couplePartnerName,
    profile?.coupleMonthlyBudget,
  ]);

  const handleSubmit = form.handleSubmit(async (data) => {
    try {
      setIsLoading(true);
      await updateProfile({
        monthlyIncome: data.monthlyIncome,
        payFrequency: data.payFrequency,
        allocationNeeds: data.allocationNeeds,
        allocationWants: data.allocationWants,
        allocationSavings: data.allocationSavings,
        coupleModeEnabled: data.coupleModeEnabled,
        couplePartnerName: data.couplePartnerName,
        coupleMonthlyBudget: data.coupleMonthlyBudget,
      });
      toast.success("Cambios guardados");
      setIsLoading(false);
    } catch (e: unknown) {
      const message =
        e instanceof ConvexError
          ? String(e.data)
          : e instanceof Error
            ? e.message
            : "Error al guardar los cambios";
      form.setError("root", { message });
    } finally {
      setIsLoading(false);
    }
  });

  const handleDeleteCommitment = async (commitmentId: string) => {
    try {
      setIsLoading(true);
      await deleteCommitment({
        commitmentId: commitmentId as Parameters<
          typeof deleteCommitment
        >[0]["commitmentId"],
      });
      toast.success("Cuota eliminada");
    } catch (e: unknown) {
      const message =
        e instanceof ConvexError
          ? String(e.data)
          : e instanceof Error
            ? e.message
            : "Error al eliminar la cuota";
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  };

  return {
    form,
    commitments: commitments ?? [],
    handleSubmit,
    handleDeleteCommitment,
    isSubmitting: form.formState.isSubmitting || isLoading,
    profile,
  };
}
