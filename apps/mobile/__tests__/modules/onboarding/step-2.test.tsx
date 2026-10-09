import { act, fireEvent, render, screen } from "@testing-library/react-native";
import { useEffect } from "react";
import { Text } from "react-native";
import { Step3Allocation } from "@/modules/onboarding/components/step-3-allocation";
import { OnboardingProvider, useOnboarding } from "@/modules/onboarding/onboarding-provider";

const mockBack = jest.fn();

jest.mock("expo-router", () => ({
	useRouter: () => ({
		back: mockBack,
		canGoBack: () => true,
		replace: jest.fn(),
	}),
}));

jest.mock("@/shared/components/ui/reicon", () => {
	const { View } = require("react-native");
	return {
		Check: () => <View testID="icon-check" />,
		ChevronLeft: () => <View testID="icon-back" />,
	};
});

jest.mock("@expo/ui/community/slider", () => {
	const { View } = require("react-native");
	return {
		Slider: (props: { onValueChange: (value: number) => void }) => (
			<View onValueChange={props.onValueChange} />
		),
	};
});

function setSlider(testId: string, value: number) {
	const wrapper = screen.getByTestId(testId);
	const slider = wrapper.props.children;
	return act(async () => {
		slider.props.onValueChange(value);
	});
}

function SeedStep2() {
	const { dispatch } = useOnboarding();
	useEffect(() => {
		dispatch({ type: "SET_STEP", payload: 2 });
	}, [dispatch]);
	return null;
}

function StateProbe() {
	const { state } = useOnboarding();
	return (
		<>
			<Text testID="probe-needs">{String(state.allocationNeeds)}</Text>
			<Text testID="probe-wants">{String(state.allocationWants)}</Text>
			<Text testID="probe-savings">{String(state.allocationSavings)}</Text>
		</>
	);
}

function renderStep2() {
	return render(
		<OnboardingProvider>
			<SeedStep2 />
			<StateProbe />
			<Step3Allocation />
		</OnboardingProvider>,
	);
}

describe("Paso 2 reparto", () => {
	beforeEach(() => {
		jest.clearAllMocks();
	});

	it("muestra 02/04 y arranca en 50/30/20", async () => {
		await renderStep2();
		expect(screen.getByText("TU SISTEMA · 02/04")).toBeTruthy();
		expect(screen.getByText("Necesidades")).toBeTruthy();
		expect(screen.getByText("Gustos")).toBeTruthy();
		expect(screen.getByText("Ahorro")).toBeTruthy();
		expect(screen.getByTestId("allocation-percent-needs").props.children).toBe("50%");
		expect(screen.getByTestId("allocation-percent-wants").props.children).toBe("30%");
		expect(screen.getByTestId("allocation-percent-savings").props.children).toBe("20%");
		expect(screen.getByText("Suma 100%")).toBeTruthy();
		expect(screen.getByTestId("probe-needs").props.children).toBe("50");
		expect(screen.getByTestId("probe-wants").props.children).toBe("30");
		expect(screen.getByTestId("probe-savings").props.children).toBe("20");
	});

	it("Volver al 50/30/20 resetea el reparto", async () => {
		await renderStep2();
		await setSlider("allocation-slider-needs", 60);
		expect(screen.getByTestId("probe-needs").props.children).toBe("60");
		await act(async () => {
			fireEvent.press(screen.getByText("Volver al 50/30/20"));
		});
		expect(screen.getByTestId("probe-needs").props.children).toBe("50");
		expect(screen.getByTestId("probe-wants").props.children).toBe("30");
		expect(screen.getByTestId("probe-savings").props.children).toBe("20");
		expect(screen.getByText("Suma 100%")).toBeTruthy();
	});
});
