"use client";

import { useForm } from "@tanstack/react-form";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { z } from "zod";
import { authClient } from "@/auth/auth-client";
import { QuipuLogo } from "@/shared/components/quipu-logo";
import { Button } from "@/shared/components/ui/button";
import { Field, FieldError, FieldGroup, FieldLabel } from "@/shared/components/ui/field";
import { authLabelClass, authPrimaryButtonClass } from "../constants";
import { AuthBanner } from "./auth-banner";
import { AuthInput } from "./auth-input";
import { AuthSidePanel } from "./auth-side-panel";

const resetPasswordSchema = z
	.object({
		password: z.string().min(8, "Mínimo 8 caracteres"),
		confirm: z.string().min(1, "Confirma tu contraseña"),
	})
	.refine((data) => data.password === data.confirm, {
		message: "Las contraseñas no coinciden",
		path: ["confirm"],
	});

export function ResetPasswordView({ token }: { token: string | null }) {
	const router = useRouter();
	const [serverError, setServerError] = useState(false);
	const invalidToken = !token || token.length < 8;

	const form = useForm({
		defaultValues: { password: "", confirm: "" },
		validators: { onChange: resetPasswordSchema },
		onSubmit: async ({ value }) => {
			if (!token) return;
			setServerError(false);
			const { error } = await authClient.resetPassword({
				newPassword: value.password,
				token,
			});
			if (error) {
				setServerError(true);
				return;
			}
			toast.success("Contraseña actualizada");
			router.push("/sign-in?reason=password-reset");
		},
	});

	return (
		<div className="grid min-h-svh lg:grid-cols-[400px_1fr]">
			<AuthSidePanel />
			<div className="flex flex-col px-6 py-8 sm:px-10">
				<div className="lg:hidden">
					<QuipuLogo />
				</div>
				<div className="flex flex-1 items-center justify-center">
					<div className="flex w-full max-w-95 flex-col gap-5">
						<h1 className="font-serif text-[26px] font-medium text-ink">Nueva contraseña</h1>
						{invalidToken ? (
							<>
								<AuthBanner
									variant="error"
									title="Enlace inválido o caducado"
									description="Pide uno nuevo desde recuperar acceso."
								/>
								<Link
									href="/recuperar"
									className="text-center text-[13.5px] font-medium text-qp-deep hover:underline"
								>
									Recuperar acceso
								</Link>
							</>
						) : (
							<>
								{serverError ? (
									<AuthBanner
										variant="error"
										title="No pudimos guardar la contraseña"
										description="El enlace puede haber caducado. Pide uno nuevo."
									/>
								) : null}
								<form
									className="flex flex-col gap-4"
									onSubmit={(e) => {
										e.preventDefault();
										e.stopPropagation();
										form.handleSubmit();
									}}
								>
									<FieldGroup>
										<form.Field name="password">
											{(field) => {
												const isInvalid = field.state.meta.isTouched && !field.state.meta.isValid;
												return (
													<Field data-invalid={isInvalid}>
														<FieldLabel htmlFor={field.name} className={authLabelClass}>
															Contraseña nueva
														</FieldLabel>
														<AuthInput
															id={field.name}
															type="password"
															name={field.name}
															value={field.state.value}
															onBlur={field.handleBlur}
															onChange={(e) => field.handleChange(e.target.value)}
															aria-invalid={isInvalid}
															autoComplete="new-password"
															autoFocus
														/>
														{isInvalid ? <FieldError errors={field.state.meta.errors} /> : null}
													</Field>
												);
											}}
										</form.Field>
										<form.Field name="confirm">
											{(field) => {
												const isInvalid = field.state.meta.isTouched && !field.state.meta.isValid;
												return (
													<Field data-invalid={isInvalid}>
														<FieldLabel htmlFor={field.name} className={authLabelClass}>
															Repite la contraseña
														</FieldLabel>
														<AuthInput
															id={field.name}
															type="password"
															name={field.name}
															value={field.state.value}
															onBlur={field.handleBlur}
															onChange={(e) => field.handleChange(e.target.value)}
															aria-invalid={isInvalid}
															autoComplete="new-password"
														/>
														{isInvalid ? <FieldError errors={field.state.meta.errors} /> : null}
													</Field>
												);
											}}
										</form.Field>
									</FieldGroup>
									<form.Subscribe selector={(s) => [s.canSubmit, s.isSubmitting] as const}>
										{([canSubmit, isSubmitting]) => (
											<Button
												type="submit"
												disabled={!canSubmit || isSubmitting}
												className={authPrimaryButtonClass}
											>
												{isSubmitting ? "Guardando..." : "Guardar contraseña"}
											</Button>
										)}
									</form.Subscribe>
								</form>
							</>
						)}
					</div>
				</div>
			</div>
		</div>
	);
}
