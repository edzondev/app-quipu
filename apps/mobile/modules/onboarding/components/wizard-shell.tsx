import { useRouter } from "expo-router";
import type { ReactNode } from "react";
import { Pressable, ScrollView, View } from "react-native";
import { KeyboardAvoidingView } from "react-native-keyboard-controller";
import { MonoLabel } from "@/modules/onboarding/components/mono-label";
import { useOnboarding } from "@/modules/onboarding/onboarding-provider";
import { ChevronLeft } from "@/shared/components/ui/reicon";
import { WIZARD_STEPS, type WizardStep } from "@/shared/lib/onboarding/types";

type WizardShellProps = {
	stepNumber: number;
	children: ReactNode;
	footer?: ReactNode;
	onBack?: () => void;
};

export function WizardShell({ stepNumber, children, footer, onBack }: WizardShellProps) {
	const router = useRouter();
	const { dispatch } = useOnboarding();

	const goBack = () => {
		if (onBack) {
			onBack();
			return;
		}
		if (stepNumber <= 1) {
			if (router.canGoBack()) {
				router.back();
			} else {
				router.replace("/(onboarding)");
			}
			return;
		}
		dispatch({ type: "SET_STEP", payload: (stepNumber - 1) as WizardStep });
	};

	return (
		<KeyboardAvoidingView behavior="padding" style={{ flex: 1 }}>
			<View className="flex-1 bg-background px-6 pt-16">
				<View className="h-14 flex-row items-center">
					<Pressable onPress={goBack} hitSlop={12} className="-ml-1 px-1 py-2" testID="wizard-back">
						<ChevronLeft size={22} colorClassName="accent-foreground" />
					</Pressable>
				</View>

				<View className="gap-4">
					<MonoLabel>{`TU SISTEMA · ${String(stepNumber).padStart(2, "0")}/${String(WIZARD_STEPS.length).padStart(2, "0")}`}</MonoLabel>
					<View className="flex-row gap-1.5">
						{WIZARD_STEPS.map((segment) => (
							<View
								key={segment}
								testID={`wizard-progress-${segment}`}
								className={
									segment <= stepNumber
										? "h-1 flex-1 rounded-full bg-primary"
										: "h-1 flex-1 rounded-full bg-line"
								}
							/>
						))}
					</View>
				</View>

				<ScrollView
					className="flex-1"
					contentContainerClassName="pt-8"
					keyboardShouldPersistTaps="handled"
					showsVerticalScrollIndicator={false}
				>
					{children}
				</ScrollView>

				{footer ? <View className="pb-4">{footer}</View> : null}
			</View>
		</KeyboardAvoidingView>
	);
}
