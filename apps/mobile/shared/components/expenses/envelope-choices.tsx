import { Pressable, Text, View } from "react-native";
import type { ExpenseEnvelopeChoice } from "@/shared/lib/expenses/expense-record";

const HIT_SLOP = { top: 8, bottom: 8, left: 8, right: 8 };

// Un gasto sale de Necesidades o Gustos: el sobre de Ahorro no se gasta.
export const ENVELOPE_CHOICES = [
	{ type: "needs", label: "Necesidades" },
	{ type: "wants", label: "Gustos" },
] as const;

const SELECTED_FRAME = {
	needs: "border-needs bg-needs/15",
	wants: "border-wants bg-wants/15",
} as const;

const SELECTED_TEXT = {
	needs: "font-hanken-semibold text-needs",
	wants: "font-hanken-semibold text-wants",
} as const;

export function envelopeChoiceLabel(type: ExpenseEnvelopeChoice | null): string {
	return ENVELOPE_CHOICES.find((choice) => choice.type === type)?.label ?? "Elegir";
}

export function EnvelopeChoices({
	value,
	onChange,
	disabled = false,
}: {
	value: ExpenseEnvelopeChoice | null;
	onChange: (type: ExpenseEnvelopeChoice) => void;
	disabled?: boolean;
}) {
	return (
		<View className="flex-row gap-2">
			{ENVELOPE_CHOICES.map((choice) => {
				const selected = value === choice.type;
				return (
					<Pressable
						key={choice.type}
						accessibilityRole="button"
						accessibilityState={{ selected, disabled }}
						disabled={disabled}
						hitSlop={HIT_SLOP}
						onPress={() => onChange(choice.type)}
						className={`flex-1 items-center rounded-[11px] border py-[11px] active:opacity-60 ${
							selected ? SELECTED_FRAME[choice.type] : "border-line"
						}`}
					>
						<Text
							className={`text-[13.5px] ${
								selected ? SELECTED_TEXT[choice.type] : "font-hanken text-foreground/55"
							}`}
						>
							{choice.label}
						</Text>
					</Pressable>
				);
			})}
		</View>
	);
}
