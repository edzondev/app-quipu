"use client";

import {
  loginSchema,
  type LoginSchema,
} from "@/modules/auth/schemas/login.schema";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { authClient } from "@/lib/auth-client";
import { redirect } from "next/navigation";
import { toast } from "sonner";
import { useState } from "react";
import { AUTH_ERROR_CODES } from "@/core/constants/convex.constants";

export const useLogin = () => {
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const form = useForm<LoginSchema>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const isSubmitting = form.formState.isSubmitting;

  const toggleVisibility = () => {
    setIsPasswordVisible((prev) => !prev);
  };

  const handleSubmitLogin = async (data: LoginSchema) => {
    const { error } = await authClient.signIn.email({
      email: data.email,
      password: data.password,
    });

    if (error && error.code === AUTH_ERROR_CODES.INVALID_EMAIL_OR_PASSWORD) {
      toast.error("Email o contraseña incorrectos.");
      return;
    }

    if (error) {
      toast.error(error.message || "Hubo un error al iniciar sesión.", {
        dismissible: false,
      });
      return;
    }
    redirect("/dashboard");
  };

  return {
    form,
    handleSubmitLogin,
    isSubmitting,
    isPasswordVisible,
    toggleVisibility,
  };
};
