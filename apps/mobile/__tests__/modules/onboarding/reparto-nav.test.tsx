import { act, fireEvent, render, screen } from "@testing-library/react-native";
import type { ReactNode } from "react";
import { Pressable, Text } from "react-native";
import { SistemaWizard } from "@/app/(onboarding)/sistema";
import { OnboardingProvider, useOnboarding } from "@/modules/onboarding/onboarding-provider";
import type { WizardStep } from "@/shared/lib/onboarding/types";

jest.mock("@/shared/hooks/use-profile-gate", () => ({
	useProfileGate: () => ({ isAuthReady: true, isLoading: false, profile: null }),
}));

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

jest.mock("@expo/ui", () => {
	const { View } = require("react-native");
	return {
		BottomSheet: ({ isPresented, children }: { isPresented: boolean; children: ReactNode }) =>
			isPresented ? <View>{children}</View> : null,
		RNHostView: ({ children }: { children: ReactNode }) => <View>{children}</View>,
	};
});

jest.mock("@/modules/onboarding/use-complete-onboarding", () => ({
	useCompleteOnboarding: () => ({
		submit: jest.fn(async () => true),
		isSubmitting: false,
		error: null,
		commitmentsFailed: false,
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
		</>
	);
}

describe("navegación del reparto", () => {
	it("desde el paso 2 Continuar va a Compromisos, y atrás es 4→3→2", async () => {
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
			fireEvent.press(screen.getByText("Continuar"));
		});
		expect(screen.getByTestId("probe-step").props.children).toBe("3");
		expect(screen.getByText("¿Qué pagas todos los meses?")).toBeTruthy();
		expect(screen.queryByText("Puedes gastar hoy")).toBeNull();
		expect(screen.queryByText(REPARTO)).toBeNull();

		await act(async () => {
			fireEvent.press(screen.getByTestId("wizard-back"));
		});
		expect(screen.getByTestId("probe-step").props.children).toBe("2");
		expect(screen.getAllByText(REPARTO)).toHaveLength(1);

		await act(async () => {
			fireEvent.press(screen.getByTestId("go-4"));
		});
		expect(screen.getByText("Puedes gastar hoy")).toBeTruthy();
		expect(screen.queryByText("Todo listo")).toBeNull();
		expect(screen.queryByText("Tu sistema está listo")).toBeNull();
		await act(async () => {
			fireEvent.press(screen.getByTestId("wizard-back"));
		});
		expect(screen.getByTestId("probe-step").props.children).toBe("3");
		expect(screen.getByText("¿Qué pagas todos los meses?")).toBeTruthy();
	});
});
