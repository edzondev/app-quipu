import { useForm, useStore } from "@tanstack/react-form";
import { Text, View } from "react-native";
import { PayDateField } from "@/modules/onboarding/components/pay-date-field";
import { WizardShell } from "@/modules/onboarding/components/wizard-shell";
import { useOnboarding } from "@/modules/onboarding/onboarding-provider";
import AuthButton from "@/shared/components/auth/auth-button";
import {
	isAllowedPayDate,
	NEXT_PAY_DATE_MESSAGE,
	payDateBounds,
} from "@/shared/lib/onboarding/pay-date";

export function StepPayDate() {
	const { state, dispatch } = useOnboarding();
	const now = Date.now();
	const bounds = payDateBounds(now);
	const form = useForm({
		defaultValues: { nextPayDate: state.nextPayDate ?? bounds.earliest },
		onSubmit: ({ value }) => {
			if (!isAllowedPayDate(value.nextPayDate, Date.now())) return;
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
	const nextPayDate = useStore(form.store, (store) => store.values.nextPayDate);
	const canContinue = isAllowedPayDate(nextPayDate, Date.now());

	return (
		<WizardShell
			stepNumber={2}
			footer={
				<AuthButton
					label="Continuar"
					testID="wizard-continue"
					onPress={() => void form.handleSubmit()}
					disabled={!canContinue}
				/>
			}
		>
			<View className="gap-1">
				<Text className="font-newsreader text-[28px] text-foreground">¿Cuándo cobras?</Text>
				<Text className="font-hanken text-[14px] text-foreground/55">
					Toca la fecha y elige tu próximo día de cobro. Puede ser desde mañana hasta dentro de 31
					días.
				</Text>
			</View>
			<form.Field name="nextPayDate">
				{(field) => {
					const outOfRange = !isAllowedPayDate(field.state.value, Date.now());
					const message =
						state.cycleFieldErrors.nextPayDate ?? (outOfRange ? NEXT_PAY_DATE_MESSAGE : undefined);
					return (
						<View className="mt-6 gap-3">
							<PayDateField
								value={field.state.value}
								earliest={bounds.earliest}
								latest={bounds.latest}
								invalid={message != null}
								onChange={(day) => {
									if (isAllowedPayDate(day, Date.now())) field.handleChange(day);
								}}
							/>
							{message ? (
								<Text
									testID="field-error-nextPayDate"
									className="font-hanken text-[13px] text-danger"
								>
									{message}
								</Text>
							) : (
								<Text className="font-hanken text-[13px] text-foreground/55">
									Si tu pago real llega antes o después, el ciclo se ajusta cuando registres tu
									ingreso.
								</Text>
							)}
						</View>
					);
				}}
			</form.Field>
		</WizardShell>
	);
}
