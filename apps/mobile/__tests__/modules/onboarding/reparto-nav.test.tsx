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

jest.mock("@expo/ui", () => {
	const { View } = require("react-native");
	return {
		BottomSheet: ({ isPresented, children }: { isPresented: boolean; children: ReactNode }) =>
			isPresented ? <View>{children}</View> : null,
		RNHostView: ({ children }: { children: ReactNode }) => <View>{children}</View>,
		ScrollView: ({ children }: { children: ReactNode }) => <View>{children}</View>,
	};
});

jest.mock("@/shared/hooks/use-dashboard", () => ({
	useHomeModel: () => ({ status: "empty", profileName: "Ana", profileInitial: "A" }),
	useDashboardSummary: () => undefined,
}));

jest.mock("@/shared/hooks/use-expense-actions", () => ({
	useExpenseActions: () => ({ register: jest.fn() }),
}));

jest.mock("@/shared/hooks/use-income-actions", () => ({
	useIncomeActions: () => ({ register: jest.fn() }),
}));

jest.mock("@/modules/onboarding/use-complete-onboarding", () => ({
	useCompleteOnboarding: () => ({
		submit: jest.fn(async () => true),
		isSubmitting: false,
		error: null,
		commitmentsFailed: false,
	}),
}));

const REPARTO = "¿Cómo repartes tu dinero?";

function Harness() {
	const { state, dispatch } = useOnboarding();
	const go = (step: WizardStep) => () => dispatch({ type: "SET_STEP", payload: step });
	return (
		<>
			<SistemaWizard />
			<Text testID="probe-step">{String(state.step)}</Text>
			<Pressable testID="go-5" onPress={go(5)} />
			<Pressable
				testID="mark-saved"
				onPress={() => dispatch({ type: "UPDATE", payload: { commitmentsSaved: true } })}
			/>
		</>
	);
}

describe("navegación del reparto", () => {
	it("el contador va 01, 02, 03 y 04", async () => {
		await render(
			<OnboardingProvider>
				<Harness />
			</OnboardingProvider>,
		);

		expect(screen.getByText("TU SISTEMA · 01/05")).toBeTruthy();
		expect(screen.getByText("¿Cuánto dinero tienes hoy?")).toBeTruthy();
		await act(async () => {
			fireEvent.press(screen.getByText("Continuar"));
		});
		expect(screen.getByText("TU SISTEMA · 02/05")).toBeTruthy();
		expect(screen.getByText("¿Cuándo cobras?")).toBeTruthy();
		await act(async () => {
			fireEvent.press(screen.getByText("Continuar"));
		});
		expect(screen.getByText("TU SISTEMA · 03/05")).toBeTruthy();
		await act(async () => {
			fireEvent.press(screen.getByText("Continuar"));
		});
		expect(screen.getByText("TU SISTEMA · 04/05")).toBeTruthy();
		expect(screen.getByText("¿Qué pagas todos los meses?")).toBeTruthy();
		await act(async () => {
			fireEvent.press(screen.getByText("Continuar"));
		});
		expect(screen.getByText("TU SISTEMA · 05/05")).toBeTruthy();
		expect(screen.getByText("Empezar mi ciclo")).toBeTruthy();
		expect(screen.queryByText("Puedes gastar hoy")).toBeNull();
		expect(screen.queryByTestId("confirm-daily")).toBeNull();
	});

	it("después del cobro, Continuar va al reparto y atrás es 5→4→3", async () => {
		await render(
			<OnboardingProvider>
				<Harness />
			</OnboardingProvider>,
		);

		await act(async () => {
			fireEvent.press(screen.getByText("Continuar"));
		});
		await act(async () => {
			fireEvent.press(screen.getByText("Continuar"));
		});
		expect(screen.getAllByText(REPARTO)).toHaveLength(1);
		expect(screen.getByTestId("probe-step").props.children).toBe("3");

		await act(async () => {
			fireEvent.press(screen.getByText("Continuar"));
		});
		expect(screen.getByTestId("probe-step").props.children).toBe("4");
		expect(screen.getByText("¿Qué pagas todos los meses?")).toBeTruthy();
		expect(screen.queryByText("Puedes gastar hoy")).toBeNull();
		expect(screen.queryByText(REPARTO)).toBeNull();

		await act(async () => {
			fireEvent.press(screen.getByTestId("wizard-back"));
		});
		expect(screen.getByTestId("probe-step").props.children).toBe("3");
		expect(screen.getAllByText(REPARTO)).toHaveLength(1);

		await act(async () => {
			fireEvent.press(screen.getByTestId("go-5"));
		});
		expect(screen.getByText("Empezar mi ciclo")).toBeTruthy();
		expect(screen.queryByText("Puedes gastar hoy")).toBeNull();
		expect(screen.queryByTestId("confirm-daily")).toBeNull();
		expect(screen.queryByText("Todo listo")).toBeNull();
		expect(screen.queryByText("Tu sistema está listo")).toBeNull();
		await act(async () => {
			fireEvent.press(screen.getByTestId("wizard-back"));
		});
		expect(screen.getByTestId("probe-step").props.children).toBe("4");
		expect(screen.getByText("¿Qué pagas todos los meses?")).toBeTruthy();
	});

	it("con compromisos ya guardados salta Compromisos al ir y al volver", async () => {
		await render(
			<OnboardingProvider>
				<Harness />
			</OnboardingProvider>,
		);
		await act(async () => {
			fireEvent.press(screen.getByText("Continuar"));
		});
		await act(async () => {
			fireEvent.press(screen.getByText("Continuar"));
		});
		expect(screen.getByTestId("probe-step").props.children).toBe("3");
		await act(async () => {
			fireEvent.press(screen.getByTestId("mark-saved"));
		});
		await act(async () => {
			fireEvent.press(screen.getByText("Continuar"));
		});
		expect(screen.getByTestId("probe-step").props.children).toBe("5");
		expect(screen.getByText("Empezar mi ciclo")).toBeTruthy();
		expect(screen.queryByText("Puedes gastar hoy")).toBeNull();
		expect(screen.queryByTestId("confirm-daily")).toBeNull();
		expect(screen.queryByText("¿Qué pagas todos los meses?")).toBeNull();
		await act(async () => {
			fireEvent.press(screen.getByTestId("wizard-back"));
		});
		expect(screen.getByTestId("probe-step").props.children).toBe("3");
		expect(screen.getAllByText(REPARTO)).toHaveLength(1);
		expect(screen.queryByText("¿Qué pagas todos los meses?")).toBeNull();
	});
});
