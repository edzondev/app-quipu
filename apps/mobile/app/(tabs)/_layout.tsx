import { Tabs } from "expo-router";
import type { BottomTabBarButtonProps } from "expo-router/tabs";
import { View } from "react-native";
import { SafeAreaView as SafeAreaViewRN } from "react-native-safe-area-context";
import { ChartBar } from "reicon-react-native/icons/ChartBar";
import { Envelope } from "reicon-react-native/icons/Envelope";
import { Home } from "reicon-react-native/icons/Home";
import { ReceiptText } from "reicon-react-native/icons/ReceiptText";
import { withUniwind } from "uniwind";
import { TopInsetProvider } from "@/shared/components/app-shell";
import OnboardingGate from "@/shared/components/auth/onboarding-gate";
import { RegistrarProvider, useRegistrar } from "@/shared/components/navigation/registrar-context";
import RegistrarTabButton from "@/shared/components/navigation/registrar-tab-button";
import { OfflineBanner } from "@/shared/components/offline/offline-banner";

const SafeAreaView = withUniwind(SafeAreaViewRN);

function OpenRegistrarButton(props: BottomTabBarButtonProps) {
	const { openCreate } = useRegistrar();
	return <RegistrarTabButton {...props} onPress={() => openCreate()} />;
}

export default function TabLayout() {
	return (
		<OnboardingGate>
			<RegistrarProvider>
				<TopInsetProvider>
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
									tabBarActiveTintColor: "#1A1A1A",
									tabBarInactiveTintColor: "#9A968C",
									tabBarLabelStyle: {
										fontFamily: "HankenGrotesk-SemiBold",
										fontSize: 10,
									},
									tabBarStyle: {
										backgroundColor: "#FBFAF7",
										borderTopWidth: 1,
										borderTopColor: "#E8E6DF",
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
											<Home size={20} color={focused ? "#1A1A1A" : "#9A968C"} />
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
											<ReceiptText size={20} color={focused ? "#1A1A1A" : "#9A968C"} />
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
											<Envelope size={20} color={focused ? "#1A1A1A" : "#9A968C"} />
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
											<ChartBar size={20} color={focused ? "#1A1A1A" : "#9A968C"} />
										),
									}}
								/>
							</Tabs>
						</View>
					</SafeAreaView>
				</TopInsetProvider>
			</RegistrarProvider>
		</OnboardingGate>
	);
}
