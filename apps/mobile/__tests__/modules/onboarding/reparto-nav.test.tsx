import { act, fireEvent, render, screen } from "@testing-library/react-native";

jest.mock("@/shared/hooks/use-profile-gate", () => ({
	useProfileGate: () => ({ isAuthReady: true, isLoading: false, profile: null }),
}));

import { Pressable, Text } from "react-native";
import { SistemaWizard } from "@/app/(onboarding)/sistema";
import { OnboardingProvider, useOnboarding } from "@/modules/onboarding/onboarding-provider";
import type { WizardStep } from "@/shared/lib/onboarding/types";

jest.mock("expo-router", () => ({
	useRouter: () => ({
		back: jest.fn(),
		canGoBack: () => true,
		replace: jest.fn(),
		push: jest.fn(),
	}),
	Redirect: () => null,
}));

jest.mock("@/shared/components/ui/reicon", () => {
	const { View } = require("react-native");
	return {
		Check: () => <View testID="icon-check" />,
		ChevronLeft: () => <View testID="icon-back" />,
		X: () => <View testID="icon-x" />,
	};
});

jest.mock("@expo/ui/community/slider", () => {
	const { View } = require("react-native");
	return {
		Slider: () => <View />,
	};
});

jest.mock("@/modules/onboarding/use-complete-onboarding", () => ({
	useCompleteOnboarding: () => ({
		submit: jest.fn(),
		isSubmitting: false,
		error: null,
	}),
}));

const REPARTO = "¿Cómo repartes tu ingreso?";

function Harness() {
	const { state, dispatch } = useOnboarding();
	const go = (step: WizardStep) => () => dispatch({ type: "SET_STEP", payload: step });
	return (
		<>
			<SistemaWizard />
			<Text testID="probe-step">{String(state.step)}</Text>
			<Pressable testID="go-4" onPress={go(4)} />
			<Pressable testID="go-3" onPress={go(3)} />
		</>
	);
}

describe("navegación del reparto", () => {
	it("aparece una sola vez y atrás desde el 4 y el 3 cae en el 2", async () => {
		await render(
			<OnboardingProvider>
				<Harness />
			</OnboardingProvider>,
		);

		await act(async () => {
			fireEvent.press(screen.getByText("Continuar"));
		});
		expect(screen.getAllByText(REPARTO)).toHaveLength(1);
		expect(screen.getByTestId("probe-step").props.children).toBe("2");

		await act(async () => {
			fireEvent.press(screen.getByTestId("go-4"));
		});
		expect(screen.queryByText(REPARTO)).toBeNull();
		await act(async () => {
			fireEvent.press(screen.getByTestId("wizard-back"));
		});
		expect(screen.getByTestId("probe-step").props.children).toBe("2");
		expect(screen.getAllByText(REPARTO)).toHaveLength(1);

		await act(async () => {
			fireEvent.press(screen.getByTestId("go-3"));
		});
		expect(screen.queryByText(REPARTO)).toBeNull();
		await act(async () => {
			fireEvent.press(screen.getByTestId("wizard-back"));
		});
		expect(screen.getByTestId("probe-step").props.children).toBe("2");
		expect(screen.getAllByText(REPARTO)).toHaveLength(1);
	});
});
