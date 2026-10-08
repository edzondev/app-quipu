import { Pressable, Text, TextInput, View } from "react-native";
import { X } from "@/shared/components/ui/reicon";
import { isCommitmentValid } from "@/shared/lib/onboarding/commitments";
import { formatIntegerEs } from "@/shared/lib/onboarding/daily";
import type { DraftCommitment } from "@/shared/lib/onboarding/types";
import { MonoLabel } from "./mono-label";

function amountDigits(amountCents: number): string {
	return amountCents > 0 ? String(Math.floor(amountCents / 100)) : "";
}

function dayDigits(dueDay: number): string {
	return dueDay >= 1 ? String(dueDay) : "";
}

type CommitmentRowProps = {
	index: number;
	commitment: DraftCommitment;
	onChange: (next: DraftCommitment) => void;
	onRemove: () => void;
};

export function CommitmentRow({ index, commitment, onChange, onRemove }: CommitmentRowProps) {
	const valid = isCommitmentValid(commitment);

	return (
		<View
			testID={`commitment-row-${index}`}
			className={`rounded-xl border px-3 py-3 ${valid ? "border-line" : "border-danger"}`}
		>
			<View className="flex-row items-center gap-2">
				<TextInput
					testID={`commitment-name-${index}`}
					value={commitment.name}
					onChangeText={(text) => onChange({ ...commitment, name: text })}
					placeholder="Nombre"
					className="flex-1 font-hanken text-[15px] text-foreground"
				/>
				<Pressable testID={`remove-commitment-${index}`} onPress={onRemove} hitSlop={10}>
					<X size={16} colorClassName="text-foreground/45" />
				</Pressable>
			</View>

			<View className="mt-2 flex-row items-baseline gap-2">
				<Text className="font-newsreader text-[16px] text-foreground/45">S/</Text>
				<TextInput
					testID={`commitment-amount-${index}`}
					value={formatIntegerEs(amountDigits(commitment.amountCents))}
					onChangeText={(raw) => {
						const next = raw.replace(/\D/g, "").slice(0, 9);
						onChange({
							...commitment,
							amountCents: next ? Number(next) * 100 : 0,
						});
					}}
					keyboardType="number-pad"
					placeholder="0"
					className="w-20 font-newsreader text-[16px] text-foreground"
				/>
				<MonoLabel className="ml-auto">CADA DÍA</MonoLabel>
				<TextInput
					testID={`commitment-day-${index}`}
					value={dayDigits(commitment.dueDay)}
					onChangeText={(raw) => {
						const next = raw.replace(/\D/g, "").slice(0, 2);
						onChange({ ...commitment, dueDay: next ? Number(next) : 0 });
					}}
					keyboardType="number-pad"
					placeholder="—"
					className="w-8 text-right font-hanken-semibold text-[14px] text-foreground"
				/>
			</View>
		</View>
	);
}
