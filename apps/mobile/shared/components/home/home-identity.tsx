import { Pressable, Text, View } from "react-native";
import { HIT_SLOP } from "@/shared/lib/hit-slop";

export function HomeIdentity({
	initial,
	title,
	onOpenSettings,
	onRegisterIncome,
}: {
	initial: string;
	title: string;
	onOpenSettings: () => void;
	onRegisterIncome: () => void;
}) {
	return (
		<View className="mb-2 flex-row items-center justify-between">
			<View className="min-w-0 flex-1 flex-row items-center gap-3 pr-3">
				<Pressable
					accessibilityRole="button"
					accessibilityLabel="Ajustes"
					hitSlop={HIT_SLOP}
					onPress={onOpenSettings}
					className="size-8 items-center justify-center rounded-full bg-line active:opacity-60"
				>
					<Text className="font-newsreader text-[16px] text-primary">{initial}</Text>
				</Pressable>
				<Text className="flex-1 font-hanken-semibold text-[16px] text-foreground" numberOfLines={1}>
					{title}
				</Text>
			</View>
			<Pressable
				accessibilityRole="button"
				hitSlop={HIT_SLOP}
				onPress={onRegisterIncome}
				className="active:opacity-60"
			>
				<Text className="font-hanken-semibold text-[14px] text-primary">+ Ingreso</Text>
			</Pressable>
		</View>
	);
}
