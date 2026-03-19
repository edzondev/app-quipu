"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { usePreloadedQuery } from "convex/react";
import { useMutation, useQuery } from "convex/react";
import { ConvexError } from "convex/values";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { api } from "@/convex/_generated/api";
import { authClient } from "@/lib/auth-client";
import { COUNTRY_CONFIG } from "@/modules/auth/validations/onboarding";
import type { Preloaded } from "convex/react";
import {
  type ProfileFormValues,
  profileSchema,
} from "../schemas/profile.schema";

export function useProfile(
  preloaded: Preloaded<typeof api.profiles.getMyProfile>,
) {
  const router = useRouter();
  const profile = usePreloadedQuery(preloaded);
  const email = useQuery(api.profiles.getMyUserEmail);
  const updateProfile = useMutation(api.profiles.updateProfile);

  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      name: profile?.name ?? "",
      country: profile?.country ?? "",
      currencyCode: profile?.currencyCode ?? "",
      currencySymbol: profile?.currencySymbol ?? "",
      currencyName: profile?.currencyName ?? "",
      currencyLocale: profile?.currencyLocale ?? "",
    },
  });

  const handleCountryChange = (country: string) => {
    const config = COUNTRY_CONFIG.find((c) => c.country === country);
    if (config) {
      form.setValue("country", config.country);
      form.setValue("currencyCode", config.currencyCode);
      form.setValue("currencySymbol", config.currencySymbol);
      form.setValue("currencyName", config.currencyName);
      form.setValue("currencyLocale", config.currencyLocale);
    }
  };

  const handleSubmit = form.handleSubmit(async (data) => {
    try {
      await updateProfile({
        name: data.name,
        country: data.country,
        currencyCode: data.currencyCode,
        currencySymbol: data.currencySymbol,
        currencyName: data.currencyName,
        currencyLocale: data.currencyLocale,
      });
      toast.success("Perfil actualizado");
    } catch (e: unknown) {
      const message =
        e instanceof ConvexError
          ? String(e.data)
          : e instanceof Error
            ? e.message
            : "Error al guardar el perfil";
      form.setError("root", { message });
    }
  });

  const handleSignOut = async () => {
    await authClient.signOut();
    router.push("/login");
  };

  return {
    form,
    profile,
    email: email ?? undefined,
    handleSubmit,
    handleSignOut,
    handleCountryChange,
    isSubmitting: form.formState.isSubmitting,
  };
}
