import { useRouter } from "expo-router";
import { Pressable, Text, View } from "react-native";
import { ChevronRight } from "reicon-react-native/icons/ChevronRight";
import AppShell from "@/shared/components/app-shell";
import { SobresScreen } from "@/shared/components/envelopes/sobres-screen";
import { useRegistrar } from "@/shared/components/navigation/registrar-context";
import { useAhorroPlanRow } from "@/shared/hooks/use-ahorro";
import { useSobresScreen } from "@/shared/hooks/use-dashboard";
import { HIT_SLOP } from "@/shared/lib/hit-slop";

export default function EnvelopesPage() {
	const sobres = useSobresScreen();
	const ahorroPlan = useAhorroPlanRow();
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
				<Pressable
					accessibilityRole="button"
					accessibilityLabel="Ahorro y metas"
					hitSlop={HIT_SLOP}
					onPress={() => router.push("/(tabs)/envelopes/ahorro")}
					className="mb-4 flex-row items-center justify-between active:opacity-60"
				>
					<View className="min-w-0 flex-1 pr-3">
						<Text className="font-hanken-semibold text-[15px] text-foreground">Ahorro y metas</Text>
						{ahorroPlan?.subtitle ? (
							<Text className="mt-1.5 font-hanken text-[12.5px] text-[#6B6B6B]">
								{ahorroPlan.subtitle}
							</Text>
						) : null}
					</View>
					<View className="flex-row items-center gap-2.5">
						{ahorroPlan ? (
							<Text className="font-hanken text-[14px] text-[#8C8880] tabular-nums">
								{ahorroPlan.totalLabel}
							</Text>
						) : null}
						<ChevronRight size={16} color="#9A968C" />
					</View>
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
