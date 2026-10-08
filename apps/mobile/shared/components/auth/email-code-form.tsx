import { useForm } from "@tanstack/react-form";
import { useState } from "react";
import { Pressable, Text, TextInput, View } from "react-native";
import AuthButton from "@/shared/components/auth/auth-button";
import { AuthNotice } from "@/shared/components/auth/auth-notice";
import { formatResendCountdown, useCountdown } from "@/shared/hooks/use-countdown";
import { HIT_SLOP } from "@/shared/lib/hit-slop";
import { parseOtpInput, shouldAutoVerifyOtp } from "@/shared/lib/signup-flow";

type EmailCodeFormProps = {
	errorMessage: string | null;
	onVerify: (code: string) => Promise<void>;
	onResend: () => Promise<boolean>;
};

export function EmailCodeForm({ errorMessage, onVerify, onResend }: EmailCodeFormProps) {
	const { seconds, reset } = useCountdown(60);
	const [resending, setResending] = useState(false);
	const form = useForm({
		defaultValues: { otp: "" },
		onSubmit: async ({ value }) => {
			if (!shouldAutoVerifyOtp(value.otp)) return;
			await onVerify(value.otp);
		},
	});

	const resend = async () => {
		if (resending || seconds > 0) return;
		setResending(true);
		const ok = await onResend();
		setResending(false);
		if (ok) reset();
	};

	return (
		<View className="gap-6">
			<form.Field
				name="otp"
				listeners={{
					onChange: ({ value, fieldApi }) => {
						if (!shouldAutoVerifyOtp(value) || fieldApi.form.state.isSubmitting) return;
						void fieldApi.form.handleSubmit();
					},
				}}
			>
				{(field) => (
					<View className="items-center">
						<View className="relative">
							<View className="flex-row gap-3">
								{[0, 1, 2, 3, 4, 5].map((index) => (
									<View
										key={index}
										className={
											index === field.state.value.length && field.state.value.length < 6
												? "h-14 w-12 items-center justify-center rounded-lg border border-foreground"
												: "h-14 w-12 items-center justify-center rounded-lg border border-line"
										}
									>
										<Text className="font-hanken-semibold text-[22px] text-foreground">
											{field.state.value[index] ?? ""}
										</Text>
									</View>
								))}
							</View>
							{/* Input real invisible: opacity/position inline (RN core).
							    Si una clase no se aplica, el texto se pinta sobre las cajas. */}
							<TextInput
								value={field.state.value}
								onChangeText={(raw) => field.handleChange(parseOtpInput(raw))}
								onBlur={field.handleBlur}
								keyboardType="numeric"
								maxLength={6}
								textAlign="center"
								caretHidden
								autoFocus
								accessibilityLabel="Código de verificación de 6 dígitos"
								style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0, opacity: 0 }}
							/>
						</View>
					</View>
				)}
			</form.Field>

			<View className="flex-row items-center justify-center gap-2">
				<Text className="font-hanken text-[13px] text-foreground/55">¿No te llegó?</Text>
				{seconds > 0 ? (
					<Text className="font-geist-mono text-[10.5px] tracking-[0.18em] text-foreground/45 uppercase">
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
						<Text className="font-geist-mono text-[10.5px] tracking-[0.18em] text-foreground uppercase">
							Reenviar
						</Text>
					</Pressable>
				)}
			</View>

			{errorMessage ? <AuthNotice tone="danger" message={errorMessage} /> : null}

			<form.Subscribe selector={(state) => [state.values.otp, state.isSubmitting] as const}>
				{([otp, isSubmitting]) => (
					<AuthButton
						label="Verificar"
						onPress={() => void form.handleSubmit()}
						loading={isSubmitting}
						disabled={otp.length < 6}
					/>
				)}
			</form.Subscribe>
		</View>
	);
}
