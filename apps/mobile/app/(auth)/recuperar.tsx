import { useForm, useStore } from "@tanstack/react-form";
import { useRouter } from "expo-router";
import { useState } from "react";
import { Pressable, Text, TextInput, View } from "react-native";
import { KeyboardAvoidingView } from "react-native-keyboard-controller";
import { z } from "zod";
import { authClient } from "@/lib/auth-client";
import AppShell from "@/shared/components/app-shell";
import AuthButton from "@/shared/components/auth/auth-button";
import FieldError from "@/shared/components/auth/field-error";
import { ErrorText } from "@/shared/components/forms/field-error";
import { ChevronLeft } from "@/shared/components/ui/reicon";
import { formatResendCountdown, useCountdown } from "@/shared/hooks/use-countdown";
import { passwordResetRedirectTo, shouldShowPasswordResetSent } from "@/shared/lib/auth/errors";
import { revalidateOnBlur } from "@/shared/lib/form";
import { HIT_SLOP } from "@/shared/lib/hit-slop";

const emailSchema = z
	.string()
	.trim()
	.toLowerCase()
	.min(1, "El email es obligatorio")
	.pipe(z.email("Email inválido"));

const RESET_STEPS = [
	"Abre el enlace desde este teléfono",
	"Define tu contraseña de respaldo",
	"Crea una Passkey nueva y olvídala otra vez",
] as const;

async function requestReset(email: string) {
	const redirectTo = passwordResetRedirectTo(process.env.EXPO_PUBLIC_SITE_URL);
	if (!redirectTo) return { ok: false as const };
	const { error } = await authClient.requestPasswordReset({ email, redirectTo });
	return { ok: shouldShowPasswordResetSent(error) };
}

export default function RecuperarScreen() {
	const router = useRouter();
	const [sent, setSent] = useState(false);
	const [requestError, setRequestError] = useState<string | null>(null);
	const form = useForm({
		defaultValues: { email: "" },
		validators: { onSubmit: z.object({ email: emailSchema }) },
		onSubmit: async ({ value, formApi }) => {
			setRequestError(null);
			const email = value.email.trim().toLowerCase();
			const result = await requestReset(email);
			if (!result.ok) {
				setRequestError("No pudimos enviar el enlace. Intenta de nuevo.");
				return;
			}
			formApi.setFieldValue("email", email);
			setSent(true);
		},
	});
	const email = useStore(form.store, (state) => state.values.email.trim());

	return (
		<AppShell>
			<KeyboardAvoidingView behavior="padding" style={{ flex: 1 }}>
				<View className="flex-1 bg-background">
					<View className="h-14 flex-row items-center justify-between">
						<Pressable
							onPress={() => router.back()}
							hitSlop={HIT_SLOP}
							accessibilityRole="button"
							accessibilityLabel="Volver"
							className="-ml-1 px-1 py-2 active:opacity-60"
						>
							<ChevronLeft size={22} colorClassName="accent-foreground" />
						</Pressable>
						<Text className="font-geist-mono text-[10.5px] tracking-[0.14em] text-foreground/55 uppercase">
							Recuperar acceso
						</Text>
						<View className="w-[22px]" />
					</View>
					{sent ? (
						<ResetSent
							email={email}
							onOther={() => setSent(false)}
							onResend={() => requestReset(email)}
						/>
					) : (
						<View className="flex-1 justify-center gap-6 pb-14">
							<View className="gap-1">
								<Text className="font-newsreader text-[28px] text-foreground">
									¿Cuál es tu correo?
								</Text>
								<Text className="font-hanken text-[14px] text-foreground/55">
									Te mandamos un enlace para definir una contraseña nueva.
								</Text>
							</View>
							<form.Field
								name="email"
								validators={{ onBlur: emailSchema }}
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
							{requestError ? <ErrorText message={requestError} /> : null}
							<form.Subscribe selector={(state) => [state.canSubmit, state.isSubmitting] as const}>
								{([canSubmit, isSubmitting]) => (
									<AuthButton
										label="Enviar enlace"
										onPress={() => void form.handleSubmit()}
										loading={isSubmitting}
										disabled={!canSubmit}
									/>
								)}
							</form.Subscribe>
						</View>
					)}
				</View>
			</KeyboardAvoidingView>
		</AppShell>
	);
}

function ResetSent({
	email,
	onOther,
	onResend,
}: {
	email: string;
	onOther: () => void;
	onResend: () => Promise<{ ok: boolean }>;
}) {
	const { seconds, reset } = useCountdown(60);
	const [resending, setResending] = useState(false);
	const [failed, setFailed] = useState(false);

	const resend = async () => {
		if (resending || seconds > 0) return;
		setResending(true);
		setFailed(false);
		const result = await onResend();
		setResending(false);
		if (!result.ok) {
			setFailed(true);
			return;
		}
		reset();
	};

	return (
		<View className="flex-1 pb-8">
			<View className="mt-8 gap-3">
				<Text className="font-newsreader text-[28px] text-foreground">Revisa tu correo.</Text>
				<Text className="font-hanken text-[14.5px] leading-[22px] text-foreground/55">
					Enviamos un enlace a <Text className="font-hanken-semibold text-foreground">{email}</Text>{" "}
					para que definas una contraseña nueva.
				</Text>
				<Text className="font-hanken text-[14.5px] leading-[22px] text-foreground/55">
					Vence en 1 hora.
				</Text>
			</View>
			<View className="mt-8 gap-3 border-y border-line py-4">
				{RESET_STEPS.map((step, index) => (
					<View key={step} className="flex-row gap-3">
						<Text className="font-geist-mono text-[13px] text-foreground/35">
							{String(index + 1).padStart(2, "0")}
						</Text>
						<Text className="flex-1 font-hanken text-[14px] leading-[20px] text-foreground">
							{step}
						</Text>
					</View>
				))}
			</View>
			<View className="mt-5 flex-row items-center justify-between">
				<Text className="font-hanken text-[13.5px] text-foreground/55">¿No llegó nada?</Text>
				{seconds > 0 ? (
					<Text className="font-geist-mono text-[12px] text-foreground/35 uppercase">
						Reenviar en {formatResendCountdown(seconds)}
					</Text>
				) : (
					<Pressable
						onPress={() => void resend()}
						disabled={resending}
						hitSlop={HIT_SLOP}
						accessibilityRole="button"
						className="active:opacity-60"
					>
						<Text className="font-geist-mono text-[12px] text-foreground uppercase">Reenviar</Text>
					</Pressable>
				)}
			</View>
			{failed ? <ErrorText message="No pudimos enviar el enlace. Intenta de nuevo." /> : null}
			<View className="mt-auto">
				<Pressable
					onPress={onOther}
					accessibilityRole="button"
					className="items-center py-3 active:opacity-60"
				>
					<Text className="font-hanken text-[13.5px] text-foreground/45">
						Probar con otro correo
					</Text>
				</Pressable>
			</View>
		</View>
	);
}
