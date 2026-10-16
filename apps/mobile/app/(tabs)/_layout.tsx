import { Tabs } from "expo-router";
import type { BottomTabBarButtonProps } from "expo-router/tabs";
import { View } from "react-native";
import { SafeAreaView as SafeAreaViewRN } from "react-native-safe-area-context";
import { useCSSVariable, useResolveClassNames, withUniwind } from "uniwind";
import OnboardingGate from "@/shared/components/auth/onboarding-gate";
import { RegistrarProvider, useRegistrar } from "@/shared/components/navigation/registrar-context";
import RegistrarTabButton from "@/shared/components/navigation/registrar-tab-button";
import { OfflineBanner } from "@/shared/components/offline/offline-banner";
import { ChartBar, Envelope, Home, ReceiptText } from "@/shared/components/ui/reicon";

const SafeAreaView = withUniwind(SafeAreaViewRN);

function OpenRegistrarButton(props: BottomTabBarButtonProps) {
	const { openCreate } = useRegistrar();
	return <RegistrarTabButton {...props} onPress={() => openCreate()} />;
}

export default function TabLayout() {
	const [background, foreground, line] = useCSSVariable([
		"--color-background",
		"--color-foreground",
		"--color-line",
	]) as [string, string, string];
	const inactiveLabel = useResolveClassNames("text-foreground/45");

	return (
		<OnboardingGate>
			<RegistrarProvider>
				<SafeAreaView
					className="flex-1 bg-background"
					edges={["top"]}
					mode="padding"
					testID="tabs-top-inset"
				>
					<View className="px-5.5">
						<OfflineBanner />
					</View>
					<View className="flex-1">
						<Tabs
							screenOptions={{
								headerShown: false,
								sceneStyle: {
									flex: 1,
									paddingVertical: 24,
									paddingHorizontal: 22,
									backgroundColor: background,
								},
								tabBarActiveTintColor: foreground,
								tabBarInactiveTintColor:
									typeof inactiveLabel.color === "string" ? inactiveLabel.color : foreground,
								tabBarLabelStyle: {
									fontFamily: "HankenGrotesk-SemiBold",
									fontSize: 10,
								},
								tabBarStyle: {
									backgroundColor: background,
									borderTopWidth: 1,
									borderTopColor: line,
									elevation: 0,
									shadowOpacity: 0,
									height: 68,
								},
							}}
						>
							<Tabs.Screen
								name="index"
								options={{
									title: "Inicio",
									tabBarLabel: "Inicio",
									tabBarButtonTestID: "tab-inicio",
									tabBarIcon: ({ focused }) => (
										<Home
											size={20}
											colorClassName={focused ? "accent-foreground" : "accent-foreground/45"}
										/>
									),
								}}
							/>
							<Tabs.Screen
								name="movements"
								options={{
									title: "Movimientos",
									tabBarLabel: "Movimientos",
									tabBarButtonTestID: "tab-movimientos",
									tabBarIcon: ({ focused }) => (
										<ReceiptText
											size={20}
											colorClassName={focused ? "accent-foreground" : "accent-foreground/45"}
										/>
									),
								}}
							/>
							<Tabs.Screen
								name="registrar"
								options={{
									title: "Registrar",
									tabBarButton: (props) => <OpenRegistrarButton {...props} />,
								}}
							/>
							<Tabs.Screen
								name="envelopes"
								options={{
									title: "Plan",
									tabBarLabel: "Plan",
									tabBarButtonTestID: "tab-plan",
									popToTopOnBlur: true,
									tabBarIcon: ({ focused }) => (
										<Envelope
											size={20}
											colorClassName={focused ? "accent-foreground" : "accent-foreground/45"}
										/>
									),
								}}
							/>
							<Tabs.Screen
								name="savings"
								options={{
									title: "Progreso",
									tabBarLabel: "Progreso",
									tabBarButtonTestID: "tab-progreso",
									popToTopOnBlur: true,
									tabBarIcon: ({ focused }) => (
										<ChartBar
											size={20}
											colorClassName={focused ? "accent-foreground" : "accent-foreground/45"}
										/>
									),
								}}
							/>
						</Tabs>
					</View>
				</SafeAreaView>
			</RegistrarProvider>
		</OnboardingGate>
	);
}
