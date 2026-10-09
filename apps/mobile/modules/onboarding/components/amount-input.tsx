import { Text, TextInput, View } from "react-native";
import { formatIntegerEs } from "@/shared/lib/onboarding/daily";
import { MonoLabel } from "./mono-label";

type AmountInputProps = {
	label?: string;
	/** Una línea que explica qué va en el campo, justo debajo. */
	hint?: string;
	testID?: string;
	valueCents: number | null;
	onChangeCents: (cents: number | null) => void;
};

function digitsFromCents(cents: number | null): string {
	return cents != null ? String(Math.floor(cents / 100)) : "";
}

export function AmountInput({
	label,
	hint,
	testID = "amount-input",
	valueCents,
	onChangeCents,
}: AmountInputProps) {
	const digits = digitsFromCents(valueCents);

	const handleChange = (raw: string) => {
		const next = raw.replace(/\D/g, "").slice(0, 9);
		onChangeCents(next ? Number(next) * 100 : null);
	};

	return (
		<View className="gap-2">
			{label ? <MonoLabel>{label}</MonoLabel> : null}
			<View className="flex-row items-baseline gap-2 border-b border-line pb-2">
				<Text className="font-newsreader text-[24px] text-foreground/45">S/</Text>
				<TextInput
					testID={testID}
					value={formatIntegerEs(digits)}
					onChangeText={handleChange}
					keyboardType="number-pad"
					placeholder="0"
					className="flex-1 font-newsreader text-[40px] text-foreground"
				/>
			</View>
			{hint ? <Text className="font-hanken text-[13px] text-foreground/55">{hint}</Text> : null}
		</View>
	);
}
