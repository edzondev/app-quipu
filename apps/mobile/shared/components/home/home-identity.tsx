import { Pressable, Text, View } from "react-native";
import { HIT_SLOP } from "@/shared/lib/hit-slop";
import { firstName } from "@/shared/lib/settings/model";

export function HomeIdentity({
	initial,
	name,
	onOpenSettings,
}: {
	initial: string;
	name: string;
	onOpenSettings: () => void;
}) {
	const first = firstName(name);
	return (
		<View className="mb-2 flex-row items-center gap-3">
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
				{first ? `Hola, ${first}` : "Hola"}
			</Text>
		</View>
	);
}
