import {
  loginSchema,
  type LoginSchema,
} from "@/modules/auth/schemas/login.schema";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { authClient } from "@/lib/auth-client";
import { redirect } from "next/navigation";

export const useLogin = () => {
  const form = useForm<LoginSchema>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const handleSubmitLogin = async (data: LoginSchema) => {
    await authClient.signIn.email({
      email: data.email,
      password: data.password,
    });

    redirect("/dashboard");
  };

  return {
    form,
    handleSubmitLogin,
  };
};
