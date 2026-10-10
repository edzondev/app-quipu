import DateTimePicker from "@expo/ui/community/datetime-picker";
import { useState } from "react";
import { Platform, Pressable, Text, View } from "react-native";
import {
	formatPayDate,
	payDateToPickerDate,
	pickerDateToPayDate,
} from "@/shared/lib/onboarding/pay-date";

type PayDateFieldProps = {
	/** `YYYY-MM-DD` de Lima. */
	value: string;
	earliest: string;
	latest: string;
	invalid?: boolean;
	onChange: (day: string) => void;
};

const LABEL = "Próximo cobro";
const ROW_VALID =
	"min-h-14 flex-row items-center justify-between rounded-xl border border-line px-4";
const ROW_INVALID =
	"min-h-14 flex-row items-center justify-between rounded-xl border border-danger px-4";

/**
 * Una fila como el resto de campos del onboarding; el calendario lo pone el sistema:
 * - iOS: el selector compacto nativo (la fecha es un botón que abre su calendario).
 * - Android: tocar la fila abre el diálogo de fecha de Material.
 */
export function PayDateField({ value, earliest, latest, invalid, onChange }: PayDateFieldProps) {
	const [dialogOpen, setDialogOpen] = useState(false);
	const rowClass = invalid ? ROW_INVALID : ROW_VALID;
	const pickerProps = {
		testID: "pay-date-picker",
		value: payDateToPickerDate(value),
		mode: "date",
		minimumDate: payDateToPickerDate(earliest),
		maximumDate: payDateToPickerDate(latest),
	} as const;

	if (Platform.OS === "android") {
		return (
			<>
				<Pressable
					testID="pay-date-field"
					accessibilityRole="button"
					accessibilityLabel={`${LABEL}: ${formatPayDate(value)}. Toca para cambiarla`}
					onPress={() => setDialogOpen(true)}
					className={`${rowClass} active:opacity-70`}
				>
					<Text className="font-hanken text-[15px] text-foreground/55">{LABEL}</Text>
					<Text className="font-hanken-semibold text-[15px] text-foreground">
						{formatPayDate(value)}
					</Text>
				</Pressable>
				{dialogOpen ? (
					<DateTimePicker
						{...pickerProps}
						presentation="dialog"
						positiveButton={{ label: "Listo" }}
						negativeButton={{ label: "Cancelar" }}
						onValueChange={(_event, selected) => {
							setDialogOpen(false);
							onChange(pickerDateToPayDate(selected));
						}}
						onDismiss={() => setDialogOpen(false)}
					/>
				) : null}
			</>
		);
	}

	return (
		<View className={rowClass}>
			<Text className="font-hanken text-[15px] text-foreground/55">{LABEL}</Text>
			<DateTimePicker
				{...pickerProps}
				display="compact"
				locale="es_PE"
				style={{ width: 160 }}
				onValueChange={(_event, selected) => onChange(pickerDateToPayDate(selected))}
			/>
		</View>
	);
}
