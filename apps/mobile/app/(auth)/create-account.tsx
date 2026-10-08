import { useForm } from "@tanstack/react-form";
import { useRouter } from "expo-router";
import { useRef, useState } from "react";
import { Pressable, Text, TextInput, View } from "react-native";
import { KeyboardAvoidingView } from "react-native-keyboard-controller";
import { z } from "zod";
import { authClient } from "@/lib/auth-client";
import AppShell from "@/shared/components/app-shell";
import AuthButton from "@/shared/components/auth/auth-button";
import FieldError from "@/shared/components/auth/field-error";
import { Check, ChevronLeft } from "@/shared/components/ui/reicon";
import { useCountdown } from "@/shared/hooks/use-countdown";
import { revalidateOnBlur, setFormError } from "@/shared/lib/form";
import {
	isUserAlreadyExistsError,
	mapOtpVerifyError,
	parseOtpInput,
	shouldAutoVerifyOtp,
	shouldSendOtp,
} from "@/shared/lib/signup-flow";

type Step = 1 | 2 | 3 | 4;

type Account = {
	name: string;
	email: string;
	password: string;
};

const accountSchema = z.object({
	name: z.string().trim().min(1, "Dinos cómo te llamas"),
	email: z
		.string()
		.trim()
		.toLowerCase()
		.min(1, "El email es obligatorio")
		.pipe(z.email("Email inválido")),
	password: z.string().min(8, "La contraseña debe tener al menos 8 caracteres"),
});

const otpSchema = z.object({
	otp: z.string().regex(/^\d{6}$/, "Ingresa los 6 dígitos"),
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
	const [account, setAccount] = useState<Account | null>(null);
	const [otp, setOtp] = useState("");
	const [otpError, setOtpError] = useState<string | null>(null);
	const [otpLoading, setOtpLoading] = useState(false);
	const [passkeyDone, setPasskeyDone] = useState<boolean | null>(null);
	const [passkeyLoading, setPasskeyLoading] = useState(false);
	const [passkeyError, setPasskeyError] = useState<string | null>(null);
	const { seconds: resendIn, reset: resetResend } = useCountdown(60);
	const otpRequestedForRef = useRef<string | null>(null);

	const sendOtp = async (email: string) => {
		setOtpLoading(true);
		const { error } = await authClient.emailOtp.sendVerificationOtp({
			email,
			type: "email-verification",
		});
		setOtpLoading(false);
		if (error) {
			setOtpError(error.message ?? "No se pudo enviar el código");
			return;
		}
		resetResend();
	};

	const continueToOtp = (value: Account) => {
		setAccount(value);
		setStep(2);
		if (shouldSendOtp(otpRequestedForRef.current, value.email)) {
			otpRequestedForRef.current = value.email;
			resetResend();
			void sendOtp(value.email);
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
			const { error } = await authClient.signUp.email({
				email: value.email,
				password: value.password,
				name: value.name,
			});
			if (error) {
				// Wizard idempotente: si la cuenta ya existe seguimos al paso 2;
				// el OTP prueba la propiedad del email (sin la contraseña correcta
				// no hay sesión en el paso 3).
				if (isUserAlreadyExistsError(error)) {
					continueToOtp(value);
					return;
				}
				setFormError(formApi, error.message ?? "No se pudo crear la cuenta");
				return;
			}
			continueToOtp(value);
		},
	});

	const verifyOtp = async (code: string) => {
		if (!account || otpLoading) return;
		const parsed = otpSchema.safeParse({ otp: code });
		if (!parsed.success) return;
		setOtpLoading(true);
		setOtpError(null);
		try {
			const { error } = await authClient.emailOtp.verifyEmail({
				email: account.email,
				otp: code,
			});
			if (error) {
				setOtpError(mapOtpVerifyError(error));
				return;
			}
			// Sesión transparente con las credenciales en memoria
			const signIn = await authClient.signIn.email({
				email: account.email,
				password: account.password,
			});
			if (signIn.error) {
				setOtpError("Correo verificado. Inicia sesión para continuar.");
				router.replace("/sign-in");
				return;
			}
			setStep(3);
		} finally {
			setOtpLoading(false);
		}
	};

	const createPasskey = async () => {
		setPasskeyLoading(true);
		setPasskeyError(null);
		const { error } = await authClient.passkey.addPasskey({
			name: account?.email,
		});
		setPasskeyLoading(false);
		if (error) {
			// No silenciar: quedarse en el paso 3 con el motivo visible.
			// El módulo nativo también loguea "Passkey registration error" en Metro.
			console.log("[passkey] addPasskey error:", error);
			setPasskeyError(error.message ?? "No se pudo crear la passkey");
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
							<Pressable onPress={goBack} hitSlop={12} className="-ml-1 px-1 py-2">
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
										<View className="gap-1">
											<TextInput
												value={field.state.value}
												onChangeText={(value) => field.handleChange(value)}
												onBlur={field.handleBlur}
												autoCapitalize="words"
												autoComplete="name"
												placeholder="Nombre"
												className="rounded-xl border border-line px-4 py-3 font-hanken text-[15px] text-foreground"
											/>
											<FieldError field={field} />
										</View>
									)}
								</form.Field>

								<form.Field
									name="email"
									validators={{ onBlur: accountSchema.shape.email }}
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
									validators={{ onBlur: accountSchema.shape.password }}
									listeners={{ onChange: revalidateOnBlur }}
								>
									{(field) => (
										<View className="gap-1">
											<TextInput
												value={field.state.value}
												onChangeText={(value) => field.handleChange(value)}
												onBlur={field.handleBlur}
												autoComplete="new-password"
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
										const formError = onSubmitError as { form?: string } | undefined;
										const message = formError?.form;
										return message ? (
											<Text className="font-hanken text-[13px] text-danger">{message}</Text>
										) : null;
									}}
								</form.Subscribe>
							</View>
						</View>
					) : null}

					{step === 2 ? (
						<View className="flex-1 justify-center gap-6 pb-14">
							<ProgressHeader label="CREAR CUENTA · 02/03" filled={2} />

							<View className="gap-1">
								<Text className="font-newsreader text-[28px] text-foreground">
									Confirma tu correo.
								</Text>
								<Text className="font-hanken text-[14px] text-foreground/55">
									Te enviamos un código de 6 dígitos a{" "}
									<Text className="font-hanken-semibold text-foreground">{account?.email}</Text>
								</Text>
							</View>

							<View className="items-center">
								<View className="relative">
									<View className="flex-row gap-3">
										{[0, 1, 2, 3, 4, 5].map((index) => (
											<View
												key={index}
												className={
													index === otp.length && otp.length < 6
														? "h-14 w-12 items-center justify-center rounded-lg border border-foreground"
														: "h-14 w-12 items-center justify-center rounded-lg border border-line"
												}
											>
												<Text className="font-hanken-semibold text-[22px] text-foreground">
													{otp[index] ?? ""}
												</Text>
											</View>
										))}
									</View>
									{/* Input real invisible: opacity/position inline (RN core);
                    NO usar utilities de uniwind aquí — si la clase no se
                    aplica, el texto del input se pinta sobre las cajas. */}
									<TextInput
										value={otp}
										onChangeText={(value) => {
											const next = parseOtpInput(value);
											setOtp(next);
											setOtpError(null);
											// Autoverificación al completar los 6 dígitos
											// (WCAG 3.3.8: menos carga cognitiva; el botón
											// "Verificar" queda como alternativa manual).
											if (shouldAutoVerifyOtp(next)) void verifyOtp(next);
										}}
										keyboardType="numeric"
										maxLength={6}
										textAlign="center"
										caretHidden
										autoFocus
										accessibilityLabel="Código de verificación de 6 dígitos"
										style={{
											position: "absolute",
											top: 0,
											left: 0,
											right: 0,
											bottom: 0,
											opacity: 0,
										}}
									/>
								</View>
							</View>

							<View className="flex-row items-center justify-center gap-2">
								<Text className="font-hanken text-[13px] text-foreground/55">¿No te llegó?</Text>
								{resendIn > 0 ? (
									<Text className="font-geist-mono text-[10.5px] tracking-[0.18em] text-foreground/45 uppercase">
										Reenviar en 0:{String(resendIn).padStart(2, "0")}
									</Text>
								) : (
									<Pressable
										onPress={() => {
											if (account) void sendOtp(account.email);
										}}
										disabled={otpLoading}
										hitSlop={8}
									>
										<Text className="font-geist-mono text-[10.5px] tracking-[0.18em] text-foreground uppercase">
											Reenviar
										</Text>
									</Pressable>
								)}
							</View>

							{otpError ? (
								<Text
									accessibilityRole="alert"
									accessibilityLiveRegion="polite"
									className="text-center font-hanken text-[13px] text-danger"
								>
									{otpError}
								</Text>
							) : null}

							<AuthButton
								label="Verificar"
								onPress={() => void verifyOtp(otp)}
								loading={otpLoading}
								disabled={otp.length < 6}
							/>

							<View className="rounded-xl border border-line bg-background px-4 py-3">
								<Text className="font-hanken text-[13px] text-foreground/55">
									También puedes abrir el enlace del correo desde este teléfono; Quipu continúa
									solo.
								</Text>
							</View>
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
								{passkeyError ? (
									<Text
										accessibilityRole="alert"
										accessibilityLiveRegion="polite"
										className="text-center font-hanken text-[13px] text-danger"
									>
										{passkeyError}
									</Text>
								) : null}

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
