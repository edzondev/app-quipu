import { act, fireEvent, render, screen } from "@testing-library/react-native";
import { type ReactNode, useEffect } from "react";
import { Text } from "react-native";
import { summaryWithCycle, summaryWithoutCycle } from "@/__fixtures__/dashboard-summary";
import { StepConfirm } from "@/modules/onboarding/components/step-confirm";
import { OnboardingProvider, useOnboarding } from "@/modules/onboarding/onboarding-provider";
import { mapDashboardHome, serverDailyCents } from "@/shared/lib/dashboard/home-model";
import { formatDailyAvailable } from "@/shared/lib/onboarding/daily";
import type { OnboardingState } from "@/shared/lib/onboarding/types";

const mockSubmit = jest.fn(async () => true);
const mockReplace = jest.fn();
const mockDashboardSummary = jest.fn();

const hookState = {
	submit: mockSubmit,
	isSubmitting: false,
	error: null as string | null,
	commitmentsFailed: false,
};

jest.mock("@/modules/onboarding/use-complete-onboarding", () => ({
	useCompleteOnboarding: () => hookState,
}));

jest.mock("expo-router", () => ({
	useRouter: () => ({ replace: mockReplace, back: jest.fn(), push: jest.fn() }),
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
	};
});

jest.mock("@/shared/hooks/use-dashboard", () => ({
	useHomeModel: () => ({ status: "empty", profileName: "Ana", profileInitial: "A" }),
	useDashboardSummary: () => mockDashboardSummary(),
}));

jest.mock("@/shared/hooks/use-profile-gate", () => ({
	useProfileGate: () => ({ profile: { currencyCode: "PEN" } }),
}));

jest.mock("@/shared/hooks/use-expense-actions", () => ({
	useExpenseActions: () => ({ register: jest.fn() }),
}));

jest.mock("@/shared/hooks/use-income-actions", () => ({
	useIncomeActions: () => ({ register: jest.fn() }),
}));

function SeedState({ seed }: { seed: Partial<OnboardingState> }) {
	const { dispatch } = useOnboarding();
	useEffect(() => {
		dispatch({ type: "UPDATE", payload: seed });
		dispatch({ type: "SET_STEP", payload: 4 });
	}, [dispatch, seed]);
	return null;
}

function StateProbe() {
	const { state } = useOnboarding();
	return <Text testID="probe-step">{String(state.step)}</Text>;
}

function renderConfirm(seed: Partial<OnboardingState>) {
	return render(
		<OnboardingProvider>
			<SeedState seed={seed} />
			<StateProbe />
			<StepConfirm />
		</OnboardingProvider>,
	);
}

const FULL_SEED: Partial<OnboardingState> = {
	incomeModel: "fixed",
	payFrequency: "monthly",
	referenceIncomeCents: 350000,
	allocationNeeds: 50,
	allocationWants: 30,
	allocationSavings: 20,
	commitments: [
		{ id: "c1", name: "Agua", amountCents: 110000, dueDay: 5 },
		{ id: "c2", name: "Celular", amountCents: 16500, dueDay: 10 },
	],
};

describe("StepConfirm — tu número", () => {
	beforeEach(() => {
		jest.clearAllMocks();
		mockDashboardSummary.mockReturnValue(undefined);
		hookState.submit = mockSubmit;
		hookState.isSubmitting = false;
		hookState.error = null;
		hookState.commitmentsFailed = false;
		mockSubmit.mockResolvedValue(true);
	});

	it("muestra el paso 04, el número del día y el resumen", async () => {
		await renderConfirm(FULL_SEED);
		expect(screen.getByText("TU SISTEMA · 04/04")).toBeTruthy();
		expect(screen.getByText("Puedes gastar hoy")).toBeTruthy();
		expect(screen.getByTestId("confirm-daily").props.children).toBe("—");
		expect(screen.getByText("Anota el dinero que tienes hoy para ver tu número.")).toBeTruthy();
		expect(screen.queryByText("S/ 51.16")).toBeNull();
		expect(screen.queryByText(/en 30 días/)).toBeNull();
		expect(screen.getByText("Dinero de hoy")).toBeTruthy();
		expect(screen.getByTestId("confirm-income").props.children).toBe("S/ 3,500");
		expect(screen.getByTestId("confirm-envelope-needs").props.children).toBe("50% · S/ 1,750");
		expect(screen.getByTestId("confirm-envelope-wants").props.children).toBe("30% · S/ 1,050");
		expect(screen.getByTestId("confirm-envelope-savings").props.children).toBe("20% · S/ 700");
		expect(screen.getByText("Compromisos")).toBeTruthy();
		expect(screen.getByTestId("confirm-commitments").props.children).toBe("S/ 1,265");
		expect(screen.queryByText("Todo listo")).toBeNull();
		expect(screen.queryByText("Tu sistema está listo")).toBeNull();
		expect(screen.queryByText("Ajustar algo")).toBeNull();
	});

	it("muestra el mismo diario que Inicio cuando getSummary trae hero", async () => {
		const summary = summaryWithCycle();
		summary.hero.displayDailyCents = 6400;
		summary.hero.dailyAvailableCents = 6400;
		mockDashboardSummary.mockReturnValue(summary);
		await renderConfirm(FULL_SEED);
		const home = mapDashboardHome(summary);
		if (!home) throw new Error("expected home");
		expect(serverDailyCents(summary)).toBe(6400);
		expect(home.dailyCents).toBe(6400);
		expect(screen.getByTestId("confirm-daily").props.children).toBe(
			formatDailyAvailable(home.dailyCents),
		);
		expect(screen.getByText(home.heroSubtitle)).toBeTruthy();
		expect(screen.queryByText("S/ 51.16")).toBeNull();
		expect(screen.queryByText(/en 30 días/)).toBeNull();
	});

	it("sin hero de getSummary no calcula el diario aunque haya ingreso y compromisos", async () => {
		mockDashboardSummary.mockReturnValue(summaryWithoutCycle);
		await renderConfirm(FULL_SEED);
		expect(serverDailyCents(summaryWithoutCycle)).toBeNull();
		expect(mapDashboardHome(summaryWithoutCycle)).toBeNull();
		expect(screen.getByTestId("confirm-daily").props.children).toBe("—");
		expect(screen.queryByText("S/ 51.16")).toBeNull();
	});

	it("sin referencia de ingreso muestra — y no inventa un número", async () => {
		await renderConfirm({
			incomeModel: "variable",
			cycleDurationDays: 30,
			referenceIncomeCents: null,
		});
		expect(screen.getByTestId("confirm-daily").props.children).toBe("—");
		expect(screen.getByText("Anota el dinero que tienes hoy para ver tu número.")).toBeTruthy();
		expect(screen.getByTestId("confirm-income").props.children).toBe("—");
		expect(screen.getByTestId("confirm-envelope-needs").props.children).toBe("50%");
	});

	it("'Empezar mi ciclo' abre el sheet de ingreso con el monto de referencia", async () => {
		await renderConfirm(FULL_SEED);
		await act(async () => {
			fireEvent.press(screen.getByText("Empezar mi ciclo"));
		});
		expect(mockSubmit).toHaveBeenCalledTimes(1);
		expect(screen.getByText("¿Cuánto dinero tienes hoy?")).toBeTruthy();
		expect(screen.getByText("3500.00")).toBeTruthy();
		expect(screen.getByRole("button", { name: "Ingreso" }).props.accessibilityState.selected).toBe(
			true,
		);
	});

	it("con isSubmitting deshabilita el CTA", async () => {
		hookState.isSubmitting = true;
		await renderConfirm(FULL_SEED);
		const button = screen.getByRole("button", { name: "Empezar mi ciclo" });
		expect(button.props.accessibilityState.disabled).toBe(true);
		await act(async () => {
			fireEvent.press(button);
		});
		expect(mockSubmit).not.toHaveBeenCalled();
	});

	it("si fallan los compromisos, muestra el error en español y Reintentar", async () => {
		hookState.error = "No se pudieron guardar los compromisos.";
		hookState.commitmentsFailed = true;
		await renderConfirm(FULL_SEED);
		expect(screen.getByText("No se pudieron guardar los compromisos.")).toBeTruthy();
		expect(screen.getByText("También puedes agregarlos después desde Plan.")).toBeTruthy();
		expect(screen.queryByText(/profileId/)).toBeNull();
		await act(async () => {
			fireEvent.press(screen.getByText("Reintentar"));
		});
		expect(mockSubmit).toHaveBeenCalledTimes(1);
	});

	it("el back regresa al paso 3", async () => {
		await renderConfirm(FULL_SEED);
		await act(async () => {
			fireEvent.press(screen.getByTestId("wizard-back"));
		});
		expect(screen.getByTestId("probe-step").props.children).toBe("3");
	});
});
