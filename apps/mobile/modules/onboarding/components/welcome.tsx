import { useRouter } from "expo-router";
import { Pressable, Text, View } from "react-native";
import { MonoLabel } from "@/modules/onboarding/components/mono-label";
import AuthButton from "@/shared/components/auth/auth-button";

/** Número del mockup de Bienvenida. Es un ejemplo, no un dato del usuario. */
const WELCOME_EXAMPLE = "S/ 42.30";

export function Welcome() {
	const router = useRouter();

	return (
		<View className="flex-1 justify-between px-6 pb-8">
			<View>
				<MonoLabel>QUIPU</MonoLabel>
				<Text className="mt-4 font-newsreader text-[34px] leading-tight text-foreground">
					Divide tu dinero antes de gastarlo
				</Text>
				<View className="mt-8 rounded-xl bg-primary/10 px-4 py-4">
					<MonoLabel>EJEMPLO · PUEDES GASTAR HOY</MonoLabel>
					<Text
						testID="welcome-example-amount"
						className="mt-2 font-newsreader text-[40px] text-foreground"
					>
						{WELCOME_EXAMPLE}
					</Text>
					<Text className="mt-2 font-hanken text-[13px] text-foreground/55">
						Es un ejemplo. Tu número sale del dinero que tienes hoy.
					</Text>
				</View>
			</View>
			<View className="gap-2">
				<AuthButton
					label="Crear cuenta"
					testID="welcome-create-account"
					onPress={() => router.push("/(auth)/create-account")}
				/>
				<Pressable
					testID="welcome-sign-in"
					accessibilityRole="button"
					accessibilityLabel="Ya tengo cuenta"
					onPress={() => router.push("/(auth)/sign-in")}
					className="items-center py-3 active:opacity-60"
				>
					<Text className="font-hanken-semibold text-[13.5px] text-foreground/55">
						Ya tengo cuenta
					</Text>
				</Pressable>
			</View>
		</View>
	);
}
