import { api } from "@quipu/convex-api";
import { useForm, useStore } from "@tanstack/react-form";
import { useQuery } from "convex/react";
import { Redirect, useRouter } from "expo-router";
import { useState } from "react";
import { Platform, Pressable, Text, TextInput, View } from "react-native";
import { KeyboardAvoidingView } from "react-native-keyboard-controller";
import { z } from "zod";
import { authClient } from "@/lib/auth-client";
import AppShell from "@/shared/components/app-shell";
import AuthButton from "@/shared/components/auth/auth-button";
import { AuthNotice } from "@/shared/components/auth/auth-notice";
import { EmailCodeForm } from "@/shared/components/auth/email-code-form";
import FieldError from "@/shared/components/auth/field-error";
import { ErrorText } from "@/shared/components/forms/field-error";
import { ChevronLeft } from "@/shared/components/ui/reicon";
import {
	type AuthNoticeCopy,
	credentialsMessage,
	isEmailNotVerified,
	mapOtpVerifyError,
	mapPasskeySignInError,
} from "@/shared/lib/auth/errors";
import { platformAdmitsPasskeys } from "@/shared/lib/auth/passkey-support";
import { revalidateOnBlur } from "@/shared/lib/form";
import { HIT_SLOP } from "@/shared/lib/hit-slop";

type SignInView = "welcome" | "backup" | "verify";

const signInSchema = z.object({
	email: z
		.string()
		.trim()
		.toLowerCase()
		.min(1, "El email es obligatorio")
		.pipe(z.email("Email inválido")),
	password: z.string().min(1, "La contraseña es obligatoria"),
});

function useSignInForm(
	onSignedIn: () => void,
	onUnverified: () => void,
	onError: (message: string | null) => void,
) {
	return useForm({
		defaultValues: { email: "", password: "" },
		validators: { onSubmit: signInSchema },
		onSubmit: async ({ value, formApi }) => {
			onError(null);
			const email = value.email.trim().toLowerCase();
			const { error } = await authClient.signIn.email({ email, password: value.password });
			if (!error) {
				onSignedIn();
				return;
			}
			if (isEmailNotVerified(error)) {
				const sent = await authClient.emailOtp.sendVerificationOtp({
					email,
					type: "email-verification",
				});
				if (sent.error) {
					onError("No se pudo enviar el código");
					return;
				}
				formApi.setFieldValue("email", email);
				onUnverified();
				return;
			}
			onError(credentialsMessage());
		},
	});
}

type SignInForm = ReturnType<typeof useSignInForm>;

export default function SignInScreen() {
	const router = useRouter();
	const { data: session } = authClient.useSession();
	const hasSession = Boolean(session);
	const profile = useQuery(api.profiles.getMyProfile, hasSession ? {} : "skip");
	const [passkeyLoading, setPasskeyLoading] = useState(false);
	const [view, setView] = useState<SignInView>("welcome");
	const [notice, setNotice] = useState<AuthNoticeCopy | null>(null);
	const [otpError, setOtpError] = useState<string | null>(null);
	const [submitError, setSubmitError] = useState<string | null>(null);
	const passkeysOk = platformAdmitsPasskeys(Platform.OS, Platform.Version);
	const form = useSignInForm(
		() => router.replace("/(tabs)"),
		() => {
			setSubmitError(null);
			setOtpError(null);
			setView("verify");
		},
		setSubmitError,
	);
	const email = useStore(form.store, (state) => state.values.email.trim().toLowerCase());
	const password = useStore(form.store, (state) => state.values.password);

	if (hasSession && profile === undefined) return null;
	if (hasSession) {
		return <Redirect href={profile?.onboardingComplete ? "/(tabs)" : "/(onboarding)/sistema"} />;
	}

	const signInWithPasskey = async () => {
		if (!passkeysOk) {
			setNotice(mapPasskeySignInError({ code: "NotSupportedError" }));
			setView("backup");
			return;
		}
		setPasskeyLoading(true);
		const { error } = await authClient.signIn.passkey();
		setPasskeyLoading(false);
		if (error) {
			setNotice(mapPasskeySignInError(error));
			setView("backup");
			return;
		}
		router.replace("/(tabs)");
	};

	const verifyOtp = async (code: string) => {
		setOtpError(null);
		const verified = await authClient.emailOtp.verifyEmail({ email, otp: code });
		if (verified.error) {
			setOtpError(mapOtpVerifyError(verified.error));
			return;
		}
		const signedIn = await authClient.signIn.email({ email, password });
		if (signedIn.error) {
			setSubmitError(credentialsMessage());
			setView("backup");
			return;
		}
		router.replace("/(tabs)");
	};

	const resendOtp = async () => {
		const sent = await authClient.emailOtp.sendVerificationOtp({
			email,
			type: "email-verification",
		});
		if (sent.error) {
			setOtpError("No se pudo enviar el código");
			return false;
		}
		setOtpError(null);
		return true;
	};

	return (
		<AppShell>
			<KeyboardAvoidingView behavior="padding" style={{ flex: 1 }}>
				<View className="flex-1 bg-background">
					{view === "welcome" ? (
						<Welcome
							loading={passkeyLoading}
							onPasskey={() => void signInWithPasskey()}
							onEmail={() => {
								setNotice(null);
								setView("backup");
							}}
							onCreate={() => router.push("/create-account")}
						/>
					) : (
						<View className="flex-1">
							<View className="h-14 flex-row items-center">
								<Pressable
									onPress={() => {
										setNotice(null);
										setView(view === "verify" ? "backup" : "welcome");
									}}
									hitSlop={HIT_SLOP}
									accessibilityRole="button"
									accessibilityLabel="Volver"
									className="-ml-1 px-1 py-2 active:opacity-60"
								>
									<ChevronLeft size={24} colorClassName="accent-foreground" />
								</Pressable>
							</View>
							{view === "backup" ? (
								<Backup
									form={form}
									notice={notice}
									submitError={submitError}
									passkeysOk={passkeysOk}
									passkeyLoading={passkeyLoading}
									onPasskey={() => void signInWithPasskey()}
									onCreate={() => router.push("/create-account")}
								/>
							) : (
								<View className="flex-1 justify-center gap-6 pb-14">
									<View className="gap-1">
										<Text className="font-newsreader text-[28px] text-foreground">
											Confirma tu correo.
										</Text>
										<Text className="font-hanken text-[14px] text-foreground/55">
											Te enviamos un código de 6 dígitos a{" "}
											<Text className="font-hanken-semibold text-foreground">{email}</Text>
										</Text>
									</View>
									<EmailCodeForm
										errorMessage={otpError}
										onVerify={verifyOtp}
										onResend={resendOtp}
									/>
								</View>
							)}
						</View>
					)}
				</View>
			</KeyboardAvoidingView>
		</AppShell>
	);
}

function Welcome({
	loading,
	onPasskey,
	onEmail,
	onCreate,
}: {
	loading: boolean;
	onPasskey: () => void;
	onEmail: () => void;
	onCreate: () => void;
}) {
	return (
		<View className="flex-1 justify-center gap-6 pb-14">
			<View className="gap-1">
				<Text className="font-newsreader text-[28px] text-foreground">
					Divide tu dinero antes de gastarlo.
				</Text>
				<Text className="font-hanken text-[14px] text-foreground/55">
					Entra con la seguridad de tu propio teléfono. Sin contraseñas que recordar.
				</Text>
			</View>
			<AuthButton label="Continuar con Passkey" onPress={onPasskey} loading={loading} />
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
			<AuthButton label="Entrar con correo" variant="outline" onPress={onEmail} />
			<View className="flex-row justify-center gap-1">
				<Text className="font-hanken text-[13px] text-foreground/55">¿Nuevo en Quipu?</Text>
				<Pressable onPress={onCreate} accessibilityRole="button" className="active:opacity-60">
					<Text className="font-hanken-semibold text-[13px] text-primary">Crear cuenta</Text>
				</Pressable>
			</View>
		</View>
	);
}

function Backup({
	form,
	notice,
	submitError,
	passkeysOk,
	passkeyLoading,
	onPasskey,
	onCreate,
}: {
	form: SignInForm;
	notice: AuthNoticeCopy | null;
	submitError: string | null;
	passkeysOk: boolean;
	passkeyLoading: boolean;
	onPasskey: () => void;
	onCreate: () => void;
}) {
	return (
		<View className="flex-1 gap-6 pb-8">
			{notice ? <AuthNotice {...notice} /> : null}
			<View className="gap-1">
				<Text className="font-newsreader text-[28px] text-foreground">Entra con tu respaldo.</Text>
				<Text className="font-hanken text-[14px] text-foreground/55">
					Usa la contraseña que definiste al crear la cuenta.
				</Text>
			</View>
			<View className="gap-6">
				<form.Field
					name="email"
					validators={{ onBlur: signInSchema.shape.email }}
					listeners={{ onChange: revalidateOnBlur }}
				>
					{(field) => (
						<View className="gap-1">
							<Text className="font-geist-mono text-[10.5px] tracking-[0.14em] text-foreground/55 uppercase">
								Correo
							</Text>
							<TextInput
								value={field.state.value}
								onChangeText={field.handleChange}
								onBlur={field.handleBlur}
								autoCapitalize="none"
								autoComplete="email"
								inputMode="email"
								accessibilityLabel="Correo"
								className="border-b border-line py-2.5 font-hanken text-[17px] text-foreground"
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
							<Text className="font-geist-mono text-[10.5px] tracking-[0.14em] text-foreground/55 uppercase">
								Contraseña
							</Text>
							<TextInput
								value={field.state.value}
								onChangeText={field.handleChange}
								onBlur={field.handleBlur}
								autoComplete="current-password"
								secureTextEntry
								accessibilityLabel="Contraseña"
								className="border-b border-foreground py-2.5 font-hanken text-[17px] text-foreground"
							/>
							<FieldError field={field} />
						</View>
					)}
				</form.Field>
			</View>
			<View className="rounded-xl bg-foreground/5 px-4 py-3.5">
				<Text className="font-geist-mono text-[10.5px] tracking-[0.14em] text-foreground/55 uppercase">
					Si cambiaste de teléfono
				</Text>
				<Text className="mt-2 font-hanken text-[13.5px] leading-[20px] text-foreground/55">
					Entra con tu contraseña y crea una Passkey nueva en este dispositivo desde Ajustes ·
					Seguridad.
				</Text>
			</View>
			{submitError ? <ErrorText message={submitError} /> : null}
			<form.Subscribe selector={(state) => [state.canSubmit, state.isSubmitting] as const}>
				{([canSubmit, isSubmitting]) => (
					<AuthButton
						label="Entrar"
						onPress={() => void form.handleSubmit()}
						loading={isSubmitting}
						disabled={!canSubmit}
					/>
				)}
			</form.Subscribe>
			{passkeysOk ? (
				<Pressable
					onPress={onPasskey}
					disabled={passkeyLoading}
					accessibilityRole="button"
					className="items-center active:opacity-60"
				>
					<Text className="font-hanken-semibold text-[13.5px] text-primary">
						Reintentar con Passkey
					</Text>
				</Pressable>
			) : null}
			<Pressable
				onPress={onCreate}
				accessibilityRole="button"
				className="items-center active:opacity-60"
			>
				<Text className="font-hanken text-[13px] text-foreground/55">
					¿Nuevo en Quipu? <Text className="font-hanken-semibold text-primary">Crear cuenta</Text>
				</Text>
			</Pressable>
		</View>
	);
}
