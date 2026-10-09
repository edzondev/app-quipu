import DateTimePicker from "@expo/ui/community/datetime-picker";
import { useForm } from "@tanstack/react-form";
import { Text, View } from "react-native";
import { WizardShell } from "@/modules/onboarding/components/wizard-shell";
import { useOnboarding } from "@/modules/onboarding/onboarding-provider";
import AuthButton from "@/shared/components/auth/auth-button";
import {
	isAllowedPayDate,
	NEXT_PAY_DATE_MESSAGE,
	payDateBounds,
	payDateToPickerDate,
	pickerDateToPayDate,
} from "@/shared/lib/onboarding/pay-date";

export function StepPayDate() {
	const { state, dispatch } = useOnboarding();
	const now = Date.now();
	const bounds = payDateBounds(now);
	const form = useForm({
		defaultValues: { nextPayDate: state.nextPayDate ?? bounds.earliest },
		validators: {
			onSubmit: ({ value }) => {
				if (!isAllowedPayDate(value.nextPayDate, Date.now())) {
					return { fields: { nextPayDate: NEXT_PAY_DATE_MESSAGE } };
				}
			},
		},
		onSubmit: ({ value }) => {
			dispatch({
				type: "UPDATE",
				payload: {
					nextPayDate: value.nextPayDate,
					cycleFieldErrors: {
						openingBalanceCents: state.cycleFieldErrors.openingBalanceCents,
					},
				},
			});
			dispatch({ type: "SET_STEP", payload: 3 });
		},
	});

	return (
		<WizardShell
			stepNumber={2}
			footer={
				<form.Subscribe selector={(formState) => formState.canSubmit}>
					{(canSubmit) => (
						<AuthButton
							label="Continuar"
							onPress={() => void form.handleSubmit()}
							disabled={!canSubmit}
						/>
					)}
				</form.Subscribe>
			}
		>
			<View className="gap-1">
				<Text className="font-newsreader text-[28px] text-foreground">¿Cuándo cobras?</Text>
				<Text className="font-hanken text-[14px] text-foreground/55">
					Elige el próximo día de cobro, entre mañana y los próximos 31 días.
				</Text>
			</View>
			<form.Field name="nextPayDate">
				{(field) => {
					const fieldError = field.state.meta.errors[0];
					const message =
						typeof fieldError === "string" ? fieldError : state.cycleFieldErrors.nextPayDate;
					return (
						<View className="mt-6 gap-3">
							<DateTimePicker
								testID="pay-date-picker"
								value={payDateToPickerDate(field.state.value)}
								mode="date"
								display="inline"
								presentation="inline"
								minimumDate={payDateToPickerDate(bounds.earliest)}
								maximumDate={payDateToPickerDate(bounds.latest)}
								onValueChange={(_event, selected) => {
									if (!selected) return;
									const day = pickerDateToPayDate(selected);
									if (!isAllowedPayDate(day, Date.now())) return;
									field.handleChange(day);
								}}
							/>
							{message ? (
								<Text
									testID="field-error-nextPayDate"
									className="font-hanken text-[13px] text-danger"
								>
									{message}
								</Text>
							) : null}
						</View>
					);
				}}
			</form.Field>
		</WizardShell>
	);
}
