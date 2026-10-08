import { Stack } from "expo-router";

export default function AuthLayout() {
	return (
		<Stack
			screenOptions={{
				headerShown: false,
			}}
		>
			<Stack.Screen name="sign-in" options={{ animation: "fade" }} />
			<Stack.Screen name="create-account" options={{ animation: "fade" }} />
			<Stack.Screen name="recuperar" options={{ animation: "fade" }} />
		</Stack>
	);
}
