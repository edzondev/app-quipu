import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  registerSchema,
  type RegisterSchema,
} from "@/modules/auth/schemas/register.schema";
import { authClient } from "@/lib/auth-client";
import { redirect } from "next/navigation";
import { toast } from "sonner";
import { useState } from "react";
import { AUTH_ERROR_CODES } from "@/core/constants/convex.constants";
import { analytics } from "@/lib/analytics";

export const useRegister = () => {
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);

  const form = useForm<RegisterSchema>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      email: "",
      fullName: "",
      password: "",
    },
  });

  const isSubmitting = form.formState.isSubmitting;

  const toggleVisibility = () => {
    setIsPasswordVisible((prev) => !prev);
  };

  const handleSubmit = async (data: RegisterSchema) => {
    const { error } = await authClient.signUp.email({
      email: data.email,
      password: data.password,
      name: data.fullName,
    });

    if (
      error &&
      error.code === AUTH_ERROR_CODES.USER_ALREADY_EXISTS_USE_ANOTHER_EMAIL
    ) {
      toast.error("El email ya está en uso. Usa otro email.");
      return;
    }

    if (error) {
      toast.error(error.message || "Hubo un error al registrarse.");
      return;
    }

    analytics.capture.sign_up();
    redirect("/dashboard");
  };

  return {
    form,
    handleSubmit,
    isSubmitting,
    toggleVisibility,
    isPasswordVisible,
  };
};
