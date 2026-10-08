import { Pressable, Text, View } from "react-native";
import { Backspace } from "reicon-react-native/icons/Backspace";
import { appendKeypadDigit, backspaceKeypad } from "@/shared/lib/expenses/keypad";

const KEYS = ["1", "2", "3", "4", "5", "6", "7", "8", "9", ",", "0", "backspace"] as const;

type Key = (typeof KEYS)[number];

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
		if (key === ",") return;
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
							<Text
								className={`font-hanken text-[23px] ${
									key === "," ? "text-foreground/55" : "text-foreground"
								}`}
							>
								{key}
							</Text>
						)}
					</Pressable>
				</View>
			))}
		</View>
	);
}
