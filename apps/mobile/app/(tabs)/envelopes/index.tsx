import { useRouter } from "expo-router";
import { Pressable, Text, View } from "react-native";
import { ChevronRight } from "reicon-react-native/icons/ChevronRight";
import AppShell from "@/shared/components/app-shell";
import { SobresScreen } from "@/shared/components/envelopes/sobres-screen";
import { useRegistrar } from "@/shared/components/navigation/registrar-context";
import { useSobresScreen } from "@/shared/hooks/use-dashboard";

const HIT_SLOP = { top: 12, bottom: 12, left: 12, right: 12 };

export default function EnvelopesPage() {
	const sobres = useSobresScreen();
	const { openCreate } = useRegistrar();
	const router = useRouter();

	return (
		<AppShell>
			<View className="flex-1">
				<Pressable
					accessibilityRole="button"
					accessibilityLabel="Compromisos"
					hitSlop={HIT_SLOP}
					onPress={() => router.push("/(tabs)/envelopes/compromisos")}
					className="mb-4 flex-row items-center justify-between active:opacity-60"
				>
					<Text className="font-hanken-semibold text-[15px] text-foreground">Compromisos</Text>
					<ChevronRight size={16} color="#9A968C" />
				</Pressable>
				<SobresScreen
					status={sobres.status}
					screen={sobres.status === "ready" ? sobres.screen : null}
					onMoveMoney={() => {
						// No hay mutación de traspaso entre sobres.
					}}
					onRegisterExpense={openCreate}
				/>
			</View>
		</AppShell>
	);
}
