import { api } from "@quipu/convex-api";
import { useForm } from "@tanstack/react-form";
import { useQuery } from "convex/react";
import { Redirect, useRouter } from "expo-router";
import { useState } from "react";
import { Pressable, Text, TextInput, View } from "react-native";
import { KeyboardAvoidingView } from "react-native-keyboard-controller";
import { z } from "zod";
import { authClient } from "@/lib/auth-client";
import AppShell from "@/shared/components/app-shell";
import AuthButton from "@/shared/components/auth/auth-button";
import FieldError from "@/shared/components/auth/field-error";
import { ChevronLeft } from "@/shared/components/ui/reicon";
import { revalidateOnBlur, setFormError } from "@/shared/lib/form";

type SignInView = "welcome" | "email";

const signInSchema = z.object({
	email: z
		.string()
		.trim()
		.toLowerCase()
		.min(1, "El email es obligatorio")
		.pipe(z.email("Email inválido")),
	password: z.string().min(1, "La contraseña es obligatoria"),
});

export default function SignInScreen() {
	const router = useRouter();
	const { data: session } = authClient.useSession();
	const hasSession = Boolean(session);
	const profile = useQuery(api.profiles.getMyProfile, hasSession ? {} : "skip");
	const [passkeyLoading, setPasskeyLoading] = useState(false);
	const [view, setView] = useState<SignInView>("welcome");

	const form = useForm({
		defaultValues: {
			email: "",
			password: "",
		},
		validators: {
			// onBlur a NIVEL CAMPO: un onBlur de objeto completo a nivel form
			// valida todos los campos en el blur de cualquiera (errores prematuros).
			onSubmit: signInSchema,
		},
		onSubmit: async ({ value, formApi }) => {
			const { error } = await authClient.signIn.email(value);
			if (error) {
				setFormError(formApi, error.message ?? "Email o contraseña incorrectos");
				return;
			}
			router.replace("/(tabs)");
		},
	});

	if (hasSession && profile === undefined) return null;
	if (hasSession) {
		return <Redirect href={profile?.onboardingComplete ? "/(tabs)" : "/(onboarding)/sistema"} />;
	}

	const signInWithPasskey = async () => {
		setPasskeyLoading(true);
		const { error } = await authClient.signIn.passkey();
		setPasskeyLoading(false);
		if (error) {
			setFormError(form, error.message ?? "No se pudo iniciar sesión");
			return;
		}
		router.replace("/(tabs)");
	};

	return (
		<AppShell>
			<KeyboardAvoidingView behavior="padding" style={{ flex: 1 }}>
				<View className="flex-1 bg-background">
					{view === "email" ? (
						<View className="h-14 flex-row items-center">
							<Pressable
								onPress={() => setView("welcome")}
								hitSlop={12}
								className="-ml-1 px-1 py-2"
							>
								<ChevronLeft size={24} colorClassName="accent-foreground" />
							</Pressable>
						</View>
					) : null}

					{view === "welcome" ? (
						<View className="flex-1 justify-center gap-6 pb-14">
							<View className="gap-1">
								<Text className="font-newsreader text-[28px] text-foreground">
									Divide tu dinero antes de gastarlo.
								</Text>
								<Text className="font-hanken text-[14px] text-foreground/55">
									Entra con la seguridad de tu propio teléfono. Sin contraseñas que recordar.
								</Text>
							</View>

							<AuthButton
								label="Continuar con Passkey"
								onPress={() => void signInWithPasskey()}
								loading={passkeyLoading}
							/>

							<Text className="text-center font-geist-mono text-[10.5px] tracking-[0.18em] text-foreground/45 uppercase">
								Face ID · Touch ID · Código del teléfono
							</Text>

							<View className="flex-row items-center gap-3">
								<View className="h-px flex-1 bg-line" />
								<Text className="font-geist-mono text-[10.5px] tracking-[0.18em] text-foreground/45 uppercase">
									O bien
								</Text>
								<View className="h-px flex-1 bg-line" />
							</View>

							<AuthButton
								label="Entrar con correo"
								variant="outline"
								onPress={() => setView("email")}
							/>

							<View className="flex-row justify-center gap-1">
								<Text className="font-hanken text-[13px] text-foreground/55">¿Nuevo en Quipu?</Text>
								<Pressable onPress={() => router.push("/create-account")}>
									<Text className="font-hanken-semibold text-[13px] text-foreground">
										Crear cuenta
									</Text>
								</Pressable>
							</View>
						</View>
					) : null}

					{view === "email" ? (
						<View className="flex-1 justify-center gap-6 pb-14">
							<View className="gap-1">
								<Text className="font-newsreader text-[28px] text-foreground">
									Entra a tu cuenta.
								</Text>
							</View>

							<View className="gap-3">
								<form.Field
									name="email"
									validators={{ onBlur: signInSchema.shape.email }}
									listeners={{ onChange: revalidateOnBlur }}
								>
									{(field) => (
										<View className="gap-1">
											<TextInput
												value={field.state.value}
												onChangeText={(value) => field.handleChange(value)}
												onBlur={field.handleBlur}
												autoCapitalize="none"
												autoComplete="email"
												inputMode="email"
												placeholder="Email"
												className="rounded-xl border border-line px-4 py-3 font-hanken text-[15px] text-foreground"
											/>
											<FieldError field={field} />
										</View>
									)}
								</form.Field>

								<form.Field
									name="password"
									validators={{ onBlur: signInSchema.shape.password }}
									listeners={{ onChange: revalidateOnBlur }}
								>
									{(field) => (
										<View className="gap-1">
											<TextInput
												value={field.state.value}
												onChangeText={(value) => field.handleChange(value)}
												onBlur={field.handleBlur}
												autoComplete="current-password"
												secureTextEntry
												placeholder="Contraseña"
												className="rounded-xl border border-line px-4 py-3 font-hanken text-[15px] text-foreground"
											/>
											<FieldError field={field} />
										</View>
									)}
								</form.Field>

								<form.Subscribe
									selector={(state) => [state.canSubmit, state.isSubmitting] as const}
								>
									{([canSubmit, isSubmitting]) => (
										<AuthButton
											label="Iniciar sesión"
											variant="solid"
											onPress={() => void form.handleSubmit()}
											loading={isSubmitting}
											disabled={!canSubmit}
										/>
									)}
								</form.Subscribe>
							</View>

							<View className="flex-row justify-center gap-1">
								<Text className="font-hanken text-[13px] text-foreground/55">
									¿No tienes cuenta?
								</Text>
								<Pressable onPress={() => router.push("/create-account")}>
									<Text className="font-hanken-semibold text-[13px] text-foreground">
										Crear cuenta
									</Text>
								</Pressable>
							</View>
						</View>
					) : null}

					<form.Subscribe selector={(state) => state.errorMap.onSubmit}>
						{(onSubmitError) => {
							const formError = onSubmitError as { form?: string } | undefined;
							const message = formError?.form;
							return message ? (
								<Text className="pb-4 text-center font-hanken text-[13px] text-danger">
									{message}
								</Text>
							) : null;
						}}
					</form.Subscribe>
				</View>
			</KeyboardAvoidingView>
		</AppShell>
	);
}
