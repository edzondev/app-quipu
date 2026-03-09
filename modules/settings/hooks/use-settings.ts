"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { usePreloadedQuery } from "convex/react";
import { useMutation, useQuery } from "convex/react";
import { ConvexError } from "convex/values";
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

  const handleSubmit = form.handleSubmit(async (data) => {
    try {
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
    } catch (e: unknown) {
      const message =
        e instanceof ConvexError
          ? String(e.data)
          : e instanceof Error
            ? e.message
            : "Error al guardar los cambios";
      form.setError("root", { message });
    }
  });

  const handleDeleteCommitment = async (commitmentId: string) => {
    try {
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
    }
  };

  return {
    form,
    commitments: commitments ?? [],
    handleSubmit,
    handleDeleteCommitment,
    isSubmitting: form.formState.isSubmitting,
    profile,
  };
}
