import { Pressable, Text, TextInput, View } from "react-native";
import { X } from "@/shared/components/ui/reicon";
import type { CommitmentRowInput } from "@/shared/lib/onboarding/commitments";
import { formatIntegerEs } from "@/shared/lib/onboarding/daily";
import { MonoLabel } from "./mono-label";

type CommitmentRowProps = {
	index: number;
	row: CommitmentRowInput;
	onChange: (next: CommitmentRowInput) => void;
	onRemove: () => void;
};

export function CommitmentRow({ index, row, onChange, onRemove }: CommitmentRowProps) {
	return (
		<View testID={`commitment-row-${index}`} className="rounded-xl border border-line px-3 py-3">
			<View className="flex-row items-center gap-2">
				<TextInput
					testID={`commitment-name-${index}`}
					value={row.name}
					onChangeText={(name) => onChange({ ...row, name })}
					placeholder="Nombre"
					accessibilityLabel="Nombre"
					className="flex-1 font-hanken text-[15px] text-foreground"
				/>
				<Pressable
					testID={`remove-commitment-${index}`}
					accessibilityRole="button"
					accessibilityLabel="Quitar compromiso"
					onPress={onRemove}
					hitSlop={10}
					className="active:opacity-60"
				>
					<X size={16} colorClassName="text-foreground/45" />
				</Pressable>
			</View>

			<View className="mt-2 flex-row items-baseline gap-2">
				<Text className="font-newsreader text-[16px] text-foreground/45">S/</Text>
				<TextInput
					testID={`commitment-amount-${index}`}
					value={formatIntegerEs(row.amountRaw)}
					onChangeText={(raw) =>
						onChange({ ...row, amountRaw: raw.replace(/\D/g, "").slice(0, 9) })
					}
					keyboardType="number-pad"
					placeholder="0"
					accessibilityLabel="Monto"
					className="w-20 font-newsreader text-[16px] text-foreground"
				/>
				<MonoLabel className="ml-auto">CADA DÍA</MonoLabel>
				<TextInput
					testID={`commitment-day-${index}`}
					value={row.dueDay}
					onChangeText={(raw) => onChange({ ...row, dueDay: raw.replace(/\D/g, "").slice(0, 2) })}
					keyboardType="number-pad"
					placeholder="—"
					accessibilityLabel="Día de vencimiento"
					className="w-8 text-right font-hanken-semibold text-[14px] text-foreground"
				/>
			</View>
		</View>
	);
}
