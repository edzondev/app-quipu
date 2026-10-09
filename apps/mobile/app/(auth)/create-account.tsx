import { useForm, useStore } from "@tanstack/react-form";
import { useRouter } from "expo-router";
import { useEffect, useRef, useState } from "react";
import { Pressable, Text, View } from "react-native";
import { KeyboardAvoidingView } from "react-native-keyboard-controller";
import { z } from "zod";
import { authClient } from "@/lib/auth-client";
import AppShell from "@/shared/components/app-shell";
import AuthButton from "@/shared/components/auth/auth-button";
import { AuthLabeledField } from "@/shared/components/auth/auth-labeled-field";
import { AuthNotice } from "@/shared/components/auth/auth-notice";
import { EmailVerifyStep } from "@/shared/components/auth/email-verify-step";
import { ErrorText } from "@/shared/components/forms/field-error";
import { Check, ChevronLeft } from "@/shared/components/ui/reicon";
import { emailSchema } from "@/shared/lib/auth/email-schema";
import { mapOtpVerifyError, mapPasskeySignInError } from "@/shared/lib/auth/errors";
import { formErrorMessage, revalidateOnBlur, setFormError } from "@/shared/lib/form";
import { HIT_SLOP } from "@/shared/lib/hit-slop";
import { shouldSendOtp } from "@/shared/lib/signup-flow";

type Step = 1 | 2 | 3 | 4;

const accountSchema = z.object({
	name: z.string().trim().min(1, "Dinos cómo te llamas"),
	email: emailSchema,
	password: z.string().min(8, "La contraseña debe tener al menos 8 caracteres"),
});

function ProgressHeader({ label, filled }: { label: string; filled: number }) {
	return (
		<View className="gap-4">
			<Text className="font-geist-mono text-[10.5px] tracking-[0.18em] text-foreground/45 uppercase">
				{label}
			</Text>
			<View className="flex-row gap-1.5">
				{[0, 1, 2].map((segment) => (
					<View
						key={segment}
						className={
							segment < filled
								? "h-1 flex-1 rounded-full bg-primary"
								: "h-1 flex-1 rounded-full bg-line"
						}
					/>
				))}
			</View>
		</View>
	);
}

export default function CreateAccountScreen() {
	const router = useRouter();
	const [step, setStep] = useState<Step>(1);
	const [otpError, setOtpError] = useState<string | null>(null);
	const [passkeyDone, setPasskeyDone] = useState<boolean | null>(null);
	const [passkeyLoading, setPasskeyLoading] = useState(false);
	const [passkeyError, setPasskeyError] = useState<string | null>(null);
	const otpRequestedForRef = useRef<string | null>(null);

	const sendOtp = async (target: string) => {
		const { error } = await authClient.emailOtp.sendVerificationOtp({
			email: target,
			type: "email-verification",
		});
		if (error) {
			setOtpError("No se pudo enviar el código");
			return false;
		}
		setOtpError(null);
		return true;
	};

	const continueToOtp = (email: string) => {
		setStep(2);
		if (shouldSendOtp(otpRequestedForRef.current, email)) {
			otpRequestedForRef.current = email;
			void sendOtp(email);
		}
	};

	const form = useForm({
		defaultValues: {
			name: "",
			email: "",
			password: "",
		},
		validators: {
			// onBlur vive a NIVEL CAMPO (con el slice del schema): un validator
			// onBlur de objeto completo a nivel form valida TODOS los campos en
			// el blur de cualquiera y muestra errores prematuros.
			onSubmit: accountSchema,
		},
		onSubmit: async ({ value, formApi }) => {
			const email = value.email.trim().toLowerCase();
			const name = value.name.trim();
			const { error } = await authClient.signUp.email({
				email,
				password: value.password,
				name,
			});
			if (error) {
				setFormError(formApi, "No se pudo crear la cuenta");
				return;
			}
			formApi.setFieldValue("email", email);
			formApi.setFieldValue("name", name);
			continueToOtp(email);
		},
	});
	const email = useStore(form.store, (state) => state.values.email.trim().toLowerCase());
	const password = useStore(form.store, (state) => state.values.password);
	const formRef = useRef(form);
	formRef.current = form;
	useEffect(() => {
		return () => {
			formRef.current.setFieldValue("password", "");
		};
	}, []);

	const verifyOtp = async (code: string) => {
		setOtpError(null);
		const { error } = await authClient.emailOtp.verifyEmail({ email, otp: code });
		if (error) {
			setOtpError(mapOtpVerifyError(error));
			return;
		}
		const signIn = await authClient.signIn.email({ email, password });
		if (signIn.error) {
			setOtpError("Correo verificado. Inicia sesión para continuar.");
			return;
		}
		form.setFieldValue("password", "");
		setStep(3);
	};

	const createPasskey = async () => {
		setPasskeyLoading(true);
		setPasskeyError(null);
		const { error } = await authClient.passkey.addPasskey();
		setPasskeyLoading(false);
		if (error) {
			setPasskeyError(mapPasskeySignInError(error).message);
			return;
		}
		setPasskeyDone(true);
		setStep(4);
	};

	const goBack = () => {
		if (step > 1) {
			setStep((step - 1) as Step);
			return;
		}
		router.back();
	};

	return (
		<AppShell>
			<KeyboardAvoidingView behavior="padding" style={{ flex: 1 }}>
				<View className="flex-1 bg-background">
					{step !== 4 ? (
						<View className="h-14 flex-row items-center">
							<Pressable
								onPress={goBack}
								hitSlop={HIT_SLOP}
								accessibilityRole="button"
								accessibilityLabel="Volver"
								className="-ml-1 px-1 py-2 active:opacity-60"
							>
								<ChevronLeft size={22} colorClassName="accent-foreground" />
							</Pressable>
						</View>
					) : null}

					{step === 1 ? (
						<View className="flex-1 justify-center gap-6 pb-14">
							<ProgressHeader label="CREAR CUENTA · 01/03" filled={1} />

							<View className="gap-1">
								<Text className="font-newsreader text-[28px] text-foreground">Crea tu cuenta.</Text>
								<Text className="font-hanken text-[14px] text-foreground/55">
									Tres pasos y entras con tu llave.
								</Text>
							</View>

							<View className="gap-3">
								<form.Field
									name="name"
									validators={{ onBlur: accountSchema.shape.name }}
									listeners={{ onChange: revalidateOnBlur }}
								>
									{(field) => (
										<AuthLabeledField
											label="Nombre"
											field={field}
											autoCapitalize="words"
											autoComplete="name"
										/>
									)}
								</form.Field>

								<form.Field
									name="email"
									validators={{ onBlur: accountSchema.shape.email }}
									listeners={{ onChange: revalidateOnBlur }}
								>
									{(field) => (
										<AuthLabeledField
											label="Correo"
											field={field}
											autoCapitalize="none"
											autoComplete="email"
											inputMode="email"
										/>
									)}
								</form.Field>

								<form.Field
									name="password"
									validators={{ onBlur: accountSchema.shape.password }}
									listeners={{ onChange: revalidateOnBlur }}
								>
									{(field) => (
										<AuthLabeledField
											label="Contraseña"
											field={field}
											autoComplete="new-password"
											secureTextEntry
										/>
									)}
								</form.Field>

								<form.Subscribe
									selector={(state) => [state.canSubmit, state.isSubmitting] as const}
								>
									{([canSubmit, isSubmitting]) => (
										<AuthButton
											label="Continuar"
											variant="solid"
											onPress={() => void form.handleSubmit()}
											loading={isSubmitting}
											disabled={!canSubmit}
										/>
									)}
								</form.Subscribe>

								<form.Subscribe selector={(state) => state.errorMap.onSubmit}>
									{(onSubmitError) => {
										const message = formErrorMessage(onSubmitError);
										return message ? <ErrorText message={message} /> : null;
									}}
								</form.Subscribe>
							</View>
						</View>
					) : null}

					{step === 2 ? (
						<View className="flex-1 justify-center gap-6 pb-14">
							<ProgressHeader label="CREAR CUENTA · 02/03" filled={2} />

							<EmailVerifyStep
								email={email}
								errorMessage={otpError}
								onVerify={verifyOtp}
								onResend={() => sendOtp(email)}
								footer={
									<View className="rounded-xl border border-line bg-background px-4 py-3">
										<Text className="font-hanken text-[13px] text-foreground/55">
											También puedes abrir el enlace del correo desde este teléfono; Quipu continúa
											solo.
										</Text>
									</View>
								}
							/>
						</View>
					) : null}

					{step === 3 ? (
						<View className="flex-1 justify-center gap-8 pb-14">
							<ProgressHeader label="CREAR CUENTA · 03/03" filled={3} />

							<View className="gap-1">
								<Text className="font-newsreader text-[28px] text-foreground">
									Tu teléfono será tu llave.
								</Text>
							</View>

							<View className="gap-3">
								{[
									"La llave nunca sale de tu teléfono",
									"Se sincroniza cifrada con tu cuenta de Apple o Google",
									"Puedes agregar otra en cualquier momento",
								].map((line) => (
									<View key={line} className="flex-row items-start gap-3">
										<Check size={16} colorClassName="accent-foreground" />
										<Text className="font-hanken-semibold text-[15px] text-foreground">{line}</Text>
									</View>
								))}
							</View>

							<View className="gap-4">
								{passkeyError ? <AuthNotice tone="warning" message={passkeyError} /> : null}

								<AuthButton
									label="Crear mi Passkey"
									onPress={() => void createPasskey()}
									loading={passkeyLoading}
								/>

								<AuthButton
									label="Continuar sin Passkey"
									variant="outline"
									onPress={() => {
										setPasskeyDone(false);
										setStep(4);
									}}
								/>
							</View>
						</View>
					) : null}

					{step === 4 ? (
						<View className="flex-1 justify-center gap-6 pb-14">
							<View className="items-center gap-4">
								<Text className="font-geist-mono text-[10.5px] tracking-[0.18em] text-foreground/45 uppercase">
									CUENTA LISTA
								</Text>
								<View className="h-14 w-14 items-center justify-center rounded-full bg-line">
									<Check size={28} colorClassName="accent-foreground" />
								</View>
							</View>

							<View className="gap-1">
								<Text className="text-center font-newsreader text-[28px] text-foreground">
									Ya puedes entrar con tu llave.
								</Text>
							</View>

							<View className="gap-3">
								{[
									{
										label: "Passkey",
										value: passkeyDone ? "Creada" : "Pendiente",
										done: passkeyDone,
									},
									{ label: "Correo", value: "Verificado", done: true },
									{
										label: "Respaldo",
										value: "Contraseña definida",
										done: true,
									},
								].map((row) => (
									<View key={row.label} className="flex-row items-center justify-between">
										<Text className="font-hanken text-[14px] text-foreground/55">{row.label}</Text>
										<View className="flex-row items-center gap-1.5">
											<Text className="font-hanken-semibold text-[14px] text-foreground">
												{row.value}
											</Text>
											{row.done ? <Check size={14} colorClassName="accent-primary" /> : null}
										</View>
									</View>
								))}
							</View>

							<AuthButton
								label="Configurar mi sistema"
								onPress={() => router.replace("/(onboarding)/sistema")}
							/>
						</View>
					) : null}
				</View>
			</KeyboardAvoidingView>
		</AppShell>
	);
}
