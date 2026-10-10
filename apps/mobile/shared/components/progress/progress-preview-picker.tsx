import { Pressable, Text, View } from "react-native";
import {
	progressScenarios,
	selectProgressScenario,
	useProgressPreview,
} from "@/shared/hooks/use-progress-preview";

/** Selector de escenarios de prueba para Progreso. No pinta nada fuera de desarrollo. */
export function ProgressPreviewPicker() {
	const { selected } = useProgressPreview();
	const scenarios = progressScenarios();
	if (scenarios === null) return null;

	const options = [
		{ id: null, label: "Datos reales" },
		...Object.entries(scenarios).map(([id, scenario]) => ({
			id: id as keyof typeof scenarios,
			label: scenario.label,
		})),
	];

	return (
		<View testID="progress-preview-picker" className="mb-3 gap-1.5">
			<Text className="font-geist-mono text-[10px] uppercase tracking-[0.14em] text-foreground/45">
				Vista de prueba · solo desarrollo
			</Text>
			<View className="flex-row flex-wrap gap-1.5">
				{options.map((option) => {
					const active = option.id === selected;
					return (
						<Pressable
							key={option.id ?? "live"}
							testID={`progress-preview-${option.id ?? "live"}`}
							accessibilityRole="button"
							accessibilityState={{ selected: active }}
							onPress={() => selectProgressScenario(option.id)}
							className={`rounded-full border px-3 py-1.5 active:opacity-60 ${
								active ? "border-primary bg-primary/5" : "border-line"
							}`}
						>
							<Text
								className={`text-[12px] text-foreground ${
									active ? "font-hanken-semibold" : "font-hanken"
								}`}
							>
								{option.label}
							</Text>
						</Pressable>
					);
				})}
			</View>
		</View>
	);
}
