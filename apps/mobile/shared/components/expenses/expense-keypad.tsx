import { Pressable, Text, View } from "react-native";
import { Backspace } from "reicon-react-native/icons/Backspace";
import { appendKeypadDigit, backspaceKeypad, keypadFigures } from "@/shared/lib/expenses/keypad";

const KEYS = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "0", "backspace"] as const;

type Key = (typeof KEYS)[number];

export function KeypadAmount({ currencySymbol, cents }: { currencySymbol: string; cents: number }) {
	const figures = keypadFigures(cents);
	return (
		<View className="flex-row items-end gap-2">
			<Text className="mb-2 font-newsreader text-[22px] text-foreground/55">{currencySymbol}</Text>
			<Text
				accessibilityLabel="Monto"
				className="font-newsreader text-[56px] leading-[64px] tracking-tight text-foreground"
			>
				{`${figures.major}.${figures.minor}`}
			</Text>
			<View className="mb-2 h-11 w-0.5 rounded-sm bg-stable" />
		</View>
	);
}

export function ExpenseKeypad({
	amountCents,
	onAmountChange,
}: {
	amountCents: number;
	onAmountChange: (cents: number) => void;
}) {
	function onKey(key: Key) {
		if (key === "backspace") {
			onAmountChange(backspaceKeypad(amountCents));
			return;
		}
		onAmountChange(appendKeypadDigit(amountCents, Number(key)));
	}

	return (
		<View className="flex-row flex-wrap">
			{KEYS.map((key) => (
				<View key={key} className="w-1/3">
					<Pressable
						accessibilityRole="button"
						accessibilityLabel={key === "backspace" ? "Borrar" : key}
						onPress={() => onKey(key)}
						className="items-center py-3.5 active:opacity-40"
					>
						{key === "backspace" ? (
							<Backspace size={22} color="#6B6B6B" />
						) : (
							<Text className="font-hanken text-[23px] text-foreground">{key}</Text>
						)}
					</Pressable>
				</View>
			))}
		</View>
	);
}
