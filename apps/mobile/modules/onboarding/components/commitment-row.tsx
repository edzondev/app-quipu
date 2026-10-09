import { Pressable, Text, TextInput, View } from "react-native";
import { Check, X } from "@/shared/components/ui/reicon";
import type {
	CommitmentRowErrors,
	CommitmentRowField,
	CommitmentRowInput,
} from "@/shared/lib/onboarding/commitments";
import { formatIntegerEs } from "@/shared/lib/onboarding/daily";
import { MonoLabel } from "./mono-label";

type CommitmentRowProps = {
	index: number;
	row: CommitmentRowInput;
	errors: CommitmentRowErrors;
	/** Nombre, monto y día válidos: esta fila ya cuenta para el total. */
	ready: boolean;
	onChange: (next: CommitmentRowInput) => void;
	onRemove: () => void;
};

const ERROR_ORDER: CommitmentRowField[] = ["name", "amountRaw", "dueDay"];

export function CommitmentRow({
	index,
	row,
	errors,
	ready,
	onChange,
	onRemove,
}: CommitmentRowProps) {
	const messages = ERROR_ORDER.flatMap((field) => {
		const message = errors[field];
		return message ? [{ field, message }] : [];
	});
	const border = messages.length > 0 ? "border-danger" : "border-line";
	return (
		<View testID={`commitment-row-${index}`} className={`rounded-xl border px-3 py-3 ${border}`}>
			<View className="flex-row items-center gap-2">
				<TextInput
					testID={`commitment-name-${index}`}
					value={row.name}
					onChangeText={(name) => onChange({ ...row, name })}
					placeholder="Nombre"
					accessibilityLabel="Nombre"
					className="flex-1 font-hanken text-[15px] text-foreground"
				/>
				{ready ? (
					<View
						testID={`commitment-ready-${index}`}
						accessibilityLabel="Compromiso listo"
						className="size-5 items-center justify-center rounded-full bg-savings/15"
					>
						<Check size={12} colorClassName="accent-savings" />
					</View>
				) : null}
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
				<MonoLabel className="ml-auto">VENCE EL DÍA</MonoLabel>
				<TextInput
					testID={`commitment-day-${index}`}
					value={row.dueDay}
					onChangeText={(raw) => onChange({ ...row, dueDay: raw.replace(/\D/g, "").slice(0, 2) })}
					keyboardType="number-pad"
					maxLength={2}
					placeholder="1-31"
					accessibilityLabel="Día de vencimiento"
					className="w-10 text-right font-hanken-semibold text-[14px] text-foreground"
				/>
			</View>

			{messages.length > 0 ? (
				<View className="mt-2 gap-0.5">
					{messages.map(({ field, message }) => (
						<Text
							key={field}
							testID={`commitment-error-${field}-${index}`}
							accessibilityRole="alert"
							className="font-hanken text-[12.5px] text-danger"
						>
							{message}
						</Text>
					))}
				</View>
			) : null}
		</View>
	);
}
