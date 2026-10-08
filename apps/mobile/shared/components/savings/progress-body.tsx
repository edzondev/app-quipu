import { Pressable, Text, View } from "react-native";

type Props = {
	onOpenAhorro: () => void;
};

export function ProgressBody({ onOpenAhorro }: Props) {
	return (
		<View className="flex-1">
			<Text className="font-newsreader text-[27px] leading-8 text-foreground">Progreso</Text>
			<Text className="mt-3.5 font-newsreader text-[23px] leading-8 text-foreground">
				Tu avance vive en Ahorro.
			</Text>
			<Text className="mt-3 max-w-[300px] font-hanken text-[14.5px] leading-6 text-foreground/55">
				El fondo y las metas se ven desde Plan, hasta que esta pestaña tenga su propia vista.
			</Text>
			<Pressable
				accessibilityRole="button"
				accessibilityLabel="Ver ahorro y metas"
				onPress={onOpenAhorro}
				className="mt-[22px] self-start active:opacity-60"
			>
				<Text className="font-hanken-semibold text-[14px] text-primary">Ver ahorro y metas</Text>
			</Pressable>
		</View>
	);
}
