import type { ReactNode } from "react";
import { Text, View } from "react-native";
import { EmailCodeForm } from "@/shared/components/auth/email-code-form";

type EmailVerifyStepProps = {
	email: string;
	errorMessage: string | null;
	onVerify: (code: string) => Promise<void>;
	onResend: () => Promise<boolean>;
	footer?: ReactNode;
};

export function EmailVerifyStep({
	email,
	errorMessage,
	onVerify,
	onResend,
	footer,
}: EmailVerifyStepProps) {
	return (
		<View className="gap-6">
			<View className="gap-1">
				<Text className="font-newsreader text-[28px] text-foreground">Confirma tu correo.</Text>
				<Text className="font-hanken text-[14px] text-foreground/55">
					Te enviamos un código de 6 dígitos a{" "}
					<Text className="font-hanken-semibold text-foreground">{email}</Text>
				</Text>
			</View>
			<EmailCodeForm errorMessage={errorMessage} onVerify={onVerify} onResend={onResend} />
			{footer}
		</View>
	);
}
