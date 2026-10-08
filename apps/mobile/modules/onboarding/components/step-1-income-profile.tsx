import { Pressable, Text, View } from "react-native";
import { WizardShell } from "@/modules/onboarding/components/wizard-shell";
import { useOnboarding } from "@/modules/onboarding/onboarding-provider";
import AuthButton from "@/shared/components/auth/auth-button";
import { Check } from "@/shared/components/ui/reicon";
import { INCOME_MODEL_OPTIONS } from "@/shared/lib/onboarding/defaults";

export function Step1IncomeProfile() {
	const { state, dispatch } = useOnboarding();
	const selected = state.incomeModel;

	const continueToStep2 = () => {
		if (!selected) return;
		dispatch({ type: "SET_STEP", payload: 2 });
	};

	return (
		<WizardShell
			stepNumber={1}
			footer={<AuthButton label="Continuar" onPress={continueToStep2} disabled={!selected} />}
		>
			<View className="gap-1">
				<Text className="font-newsreader text-[28px] text-foreground">¿Cómo entra tu dinero?</Text>
				<Text className="font-hanken text-[14px] text-foreground/55">
					Elige el patrón que más se parece. Lo afinamos después.
				</Text>
			</View>

			<View className="mt-6 gap-3">
				{INCOME_MODEL_OPTIONS.map((option) => {
					const isSelected = selected === option.value;
					return (
						<Pressable
							key={option.value}
							testID={`option-${option.value}`}
							onPress={() =>
								dispatch({
									type: "UPDATE",
									payload: { incomeModel: option.value },
								})
							}
							className={
								isSelected
									? "flex-row items-start gap-3 rounded-xl border border-primary bg-primary/5 px-4 py-4"
									: "flex-row items-start gap-3 rounded-xl border border-line px-4 py-4"
							}
						>
							<View className="flex-1 gap-1">
								<Text className="font-hanken-semibold text-[15px] text-foreground">
									{option.title}
								</Text>
								<Text className="font-hanken text-[13px] text-foreground/55">
									{option.description}
								</Text>
							</View>
							{isSelected ? (
								<View
									testID={`check-${option.value}`}
									className="h-6 w-6 items-center justify-center rounded-full bg-primary/10"
								>
									<Check size={14} colorClassName="accent-primary" />
								</View>
							) : null}
						</Pressable>
					);
				})}
			</View>

			{selected === "variable" ? (
				<View className="mt-4 rounded-xl border border-line bg-background px-4 py-3">
					<Text className="font-hanken text-[13px] text-foreground/55">
						Con ingresos variables, Quipu calcula el disponible sobre lo que ya recibiste, nunca
						sobre lo que esperas recibir.
					</Text>
				</View>
			) : null}
		</WizardShell>
	);
}
