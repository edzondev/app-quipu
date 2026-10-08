import { Pressable, Text, View } from "react-native";
import { FREQ_OPTIONS } from "@/shared/lib/onboarding/defaults";
import type { PayFrequency } from "@/shared/lib/onboarding/types";

type FrequencyPickerProps = {
	value: PayFrequency | null;
	onChange: (frequency: PayFrequency) => void;
};

export function FrequencyPicker({ value, onChange }: FrequencyPickerProps) {
	return (
		<View testID="frequency-picker" className="flex-row rounded-full bg-line/50 p-1">
			{FREQ_OPTIONS.map((option) => {
				const isActive = value === option.value;
				return (
					<Pressable
						key={option.value}
						testID={`freq-option-${option.value}`}
						onPress={() => onChange(option.value)}
						className={
							isActive
								? "flex-1 items-center rounded-full bg-background px-3 py-2.5 shadow-sm"
								: "flex-1 items-center rounded-full px-3 py-2.5"
						}
					>
						<Text
							className={
								isActive
									? "font-hanken-semibold text-[13px] text-foreground"
									: "font-hanken text-[13px] text-foreground/55"
							}
						>
							{option.label}
						</Text>
					</Pressable>
				);
			})}
		</View>
	);
}
