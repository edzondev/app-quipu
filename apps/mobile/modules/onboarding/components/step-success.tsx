import { useRouter } from "expo-router";
import { Pressable, Text, View } from "react-native";
import { useOnboarding } from "@/modules/onboarding/onboarding-provider";

export function StepSuccess() {
	const { dispatch } = useOnboarding();
	const router = useRouter();

	const goHome = () => {
		dispatch({ type: "RESET" });
		router.replace("/(tabs)");
	};

	return (
		<View className="flex-1 items-center justify-center px-6">
			<View className="h-16 w-16 items-center justify-center rounded-2xl bg-primary">
				<Text className="font-newsreader text-[30px] text-background">Q</Text>
			</View>

			<Text className="mt-6 font-newsreader text-[30px] text-foreground">
				Tu sistema está listo
			</Text>

			<Text className="mt-3 text-center font-hanken text-[14px] text-foreground/55">
				De aquí en adelante Quipu solo te pide una cosa: registrar lo que gastas.
			</Text>

			<Pressable
				testID="success-home"
				onPress={goHome}
				className="mt-8 rounded-xl bg-primary px-5 py-4"
			>
				<Text className="font-hanken-semibold text-[15px] text-foreground">Ir a Inicio</Text>
			</Pressable>
		</View>
	);
}
