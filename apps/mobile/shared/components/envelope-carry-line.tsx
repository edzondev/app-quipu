import { Text } from "react-native";

/** Línea de arrastre compartida por Inicio y Sobres. */
export function EnvelopeCarryLine({ label }: { label: string }) {
	return (
		<Text
			className="mt-1 font-hanken text-[12.5px] leading-[18px] text-foreground/55 tabular-nums"
			selectable
		>
			{label}
		</Text>
	);
}
