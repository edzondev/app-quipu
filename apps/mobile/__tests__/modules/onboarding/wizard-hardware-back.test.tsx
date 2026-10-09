import { act, render, screen } from "@testing-library/react-native";
import { useEffect } from "react";
import { BackHandler, Text } from "react-native";
import { WizardShell } from "@/modules/onboarding/components/wizard-shell";
import { OnboardingProvider, useOnboarding } from "@/modules/onboarding/onboarding-provider";
import type { WizardStep } from "@/shared/lib/onboarding/types";

const mockBack = jest.fn();
const mockReplace = jest.fn();
const mockCanGoBack = jest.fn(() => false);

jest.mock("expo-router", () => ({
	useRouter: () => ({
		back: mockBack,
		canGoBack: () => mockCanGoBack(),
		replace: mockReplace,
	}),
}));

jest.mock("@/shared/components/ui/reicon", () => {
	const { View } = require("react-native");
	return { ChevronLeft: () => <View /> };
});

function Seed({
	step,
	commitmentsSaved = false,
}: {
	step: WizardStep;
	commitmentsSaved?: boolean;
}) {
	const { dispatch } = useOnboarding();
	useEffect(() => {
		dispatch({ type: "UPDATE", payload: { commitmentsSaved } });
		dispatch({ type: "SET_STEP", payload: step });
	}, [commitmentsSaved, dispatch, step]);
	return null;
}

function Probe() {
	const { state } = useOnboarding();
	return <Text testID="probe-step">{String(state.step)}</Text>;
}

function pressHardwareBack() {
	const registration = jest.mocked(BackHandler.addEventListener).mock.calls.at(-1);
	const handler = registration?.[1];
	if (!handler) throw new Error("no hardware back handler");
	return handler({ type: "hardwareBackPress", timeStamp: 0 });
}

describe("WizardShell hardware back", () => {
	beforeEach(() => {
		jest.clearAllMocks();
		mockCanGoBack.mockReturnValue(false);
		jest.spyOn(BackHandler, "addEventListener").mockImplementation(() => ({ remove: jest.fn() }));
	});

	afterEach(() => {
		jest.restoreAllMocks();
	});

	it("en un paso posterior vuelve al paso anterior", async () => {
		await render(
			<OnboardingProvider>
				<Seed step={2} />
				<Probe />
				<WizardShell stepNumber={2}>
					<Text>Reparto</Text>
				</WizardShell>
			</OnboardingProvider>,
		);
		expect(screen.getByTestId("probe-step").props.children).toBe("2");
		await act(async () => {
			expect(pressHardwareBack()).toBe(true);
		});
		expect(screen.getByTestId("probe-step").props.children).toBe("1");
		expect(mockReplace).not.toHaveBeenCalled();
	});

	it("desde el paso 5 con compromisos guardados vuelve al paso 3", async () => {
		await render(
			<OnboardingProvider>
				<Seed step={5} commitmentsSaved />
				<Probe />
				<WizardShell stepNumber={5}>
					<Text>Confirmar</Text>
				</WizardShell>
			</OnboardingProvider>,
		);
		expect(screen.getByTestId("probe-step").props.children).toBe("5");
		await act(async () => {
			expect(pressHardwareBack()).toBe(true);
		});
		expect(screen.getByTestId("probe-step").props.children).toBe("3");
	});

	it("quita el listener al desmontar", async () => {
		const remove = jest.fn();
		jest.mocked(BackHandler.addEventListener).mockImplementation(() => ({ remove }));
		const view = await render(
			<OnboardingProvider>
				<WizardShell stepNumber={2}>
					<Text>Reparto</Text>
				</WizardShell>
			</OnboardingProvider>,
		);
		expect(jest.mocked(BackHandler.addEventListener)).toHaveBeenCalled();
		await act(async () => {
			view.unmount();
		});
		expect(remove).toHaveBeenCalled();
	});

	it("en el paso 1 vuelve a Bienvenida", async () => {
		await render(
			<OnboardingProvider>
				<Probe />
				<WizardShell stepNumber={1}>
					<Text>Ingreso</Text>
				</WizardShell>
			</OnboardingProvider>,
		);
		await act(async () => {
			expect(pressHardwareBack()).toBe(true);
		});
		expect(mockReplace).toHaveBeenCalledWith("/(onboarding)");
		expect(mockBack).not.toHaveBeenCalled();
	});
});
