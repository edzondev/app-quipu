import { Text } from "react-native";

export function InlineLoading({ label = "Cargando…" }: { label?: string }) {
	return <Text className="mt-6 font-hanken text-[15px] text-foreground/55">{label}</Text>;
}
