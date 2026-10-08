import { Text, View } from "react-native";
import AppShell from "@/shared/components/app-shell";

export default function ProgressPage() {
	return (
		<AppShell>
			<View className="flex-1">
				<Text className="font-newsreader text-[27px] leading-8 text-foreground">Progreso</Text>
			</View>
		</AppShell>
	);
}
