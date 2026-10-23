import { useLocalSearchParams, useRouter } from "expo-router";
import { Pressable, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { withUniwind } from "uniwind";
import { dismissNotice } from "@/modules/quipu-notification-listener";
import { DetectedExpenseSheet } from "@/shared/components/expenses/detected-expense-sheet";
import { useHardwareBack } from "@/shared/hooks/use-hardware-back";
import { readDetectedNotice } from "@/shared/lib/expenses/detected-notice";

const SafeArea = withUniwind(SafeAreaView);

export default function DetectedExpenseScreen() {
	const router = useRouter();
	const params = useLocalSearchParams();
	const notice = readDetectedNotice({
		id: params.id,
		cents: params.cents,
		merchant: params.merchant,
		bank: params.bank,
		at: params.at,
	});

	function close() {
		if (notice) dismissNotice(notice.id);
		if (router.canGoBack()) router.back();
		else router.replace("/(tabs)");
	}

	useHardwareBack(close);

	return (
		<SafeArea className="flex-1 bg-background" edges={["top", "bottom"]}>
			{notice ? (
				<DetectedExpenseSheet notice={notice} onClose={close} />
			) : (
				<View className="flex-1 px-[22px] pt-6">
					<Pressable
						accessibilityRole="button"
						accessibilityLabel="Cerrar"
						onPress={close}
						className="min-h-11 justify-center active:opacity-60"
					>
						<Text className="font-hanken-semibold text-[15px] text-foreground">Cerrar</Text>
					</Pressable>
					<Text className="pt-6 font-hanken text-[15px] text-foreground/55">
						No encontramos este gasto.
					</Text>
				</View>
			)}
		</SafeArea>
	);
}
