import { act, fireEvent, render, screen } from "@testing-library/react-native";
import { type ReactNode, useEffect } from "react";
import { Text } from "react-native";
import { summaryWithCycle, summaryWithoutCycle } from "@/__fixtures__/dashboard-summary";
import { StepConfirm } from "@/modules/onboarding/components/step-confirm";
import { OnboardingProvider, useOnboarding } from "@/modules/onboarding/onboarding-provider";
import { mapDashboardHome } from "@/shared/lib/dashboard/home-model";
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
		dispatch({ type: "SET_STEP", payload: 5 });
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
	nextPayDate: "2026-10-20",
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

	it("muestra el paso 05 y el resumen, sin la línea del diario", async () => {
		await renderConfirm(FULL_SEED);
		expect(screen.getByText("TU SISTEMA · 05/05")).toBeTruthy();
		expect(screen.queryByText("Puedes gastar hoy")).toBeNull();
		expect(screen.queryByTestId("confirm-daily")).toBeNull();
		expect(screen.queryByText("Anota el dinero que tienes hoy para ver tu número.")).toBeNull();
		expect(screen.queryByText("S/ 51.16")).toBeNull();
		expect(screen.queryByText(/en 30 días/)).toBeNull();
		expect(screen.getByText("Dinero de hoy")).toBeTruthy();
		expect(screen.getByTestId("confirm-income").props.children).toBe("S/ 3,500");
		expect(screen.getByTestId("confirm-pay-date").props.children).toBe("20 oct 2026");
		expect(screen.getByTestId("confirm-envelope-needs").props.children).toBe("50% · S/ 1,750");
		expect(screen.getByTestId("confirm-envelope-wants").props.children).toBe("30% · S/ 1,050");
		expect(screen.getByTestId("confirm-envelope-savings").props.children).toBe("20% · S/ 700");
		expect(screen.getByText("Compromisos")).toBeTruthy();
		expect(screen.getByTestId("confirm-commitments").props.children).toBe("S/ 1,265");
		expect(screen.queryByText("Todo listo")).toBeNull();
		expect(screen.queryByText("Tu sistema está listo")).toBeNull();
		expect(screen.queryByText("Ajustar algo")).toBeNull();
	});

	it("no muestra el diario del paso 5; Inicio sigue leyendo displayDailyCents", async () => {
		const summary = summaryWithCycle();
		summary.hero.displayDailyCents = 6400;
		summary.hero.dailyAvailableCents = 6400;
		mockDashboardSummary.mockReturnValue(summary);
		await renderConfirm(FULL_SEED);
		const home = mapDashboardHome(summary);
		if (!home) throw new Error("expected home");
		expect(summary.hero.displayDailyCents).toBe(6400);
		expect(home.dailyCents).toBe(summary.hero.displayDailyCents);
		expect(screen.queryByTestId("confirm-daily")).toBeNull();
		expect(screen.queryByText("Puedes gastar hoy")).toBeNull();
		expect(screen.queryByText("S/ 64")).toBeNull();
		expect(screen.queryByText("S/ 51.16")).toBeNull();
	});

	it("sin hero de getSummary el paso 5 tampoco inventa un diario", async () => {
		mockDashboardSummary.mockReturnValue(summaryWithoutCycle);
		await renderConfirm(FULL_SEED);
		expect(mapDashboardHome(summaryWithoutCycle)).toBeNull();
		expect(screen.queryByTestId("confirm-daily")).toBeNull();
		expect(screen.queryByText("S/ 51.16")).toBeNull();
		expect(screen.queryByText(/en \d+ días/)).toBeNull();
	});

	it("sin referencia de ingreso no inventa el diario y deja el ingreso en —", async () => {
		await renderConfirm({
			incomeModel: "variable",
			cycleDurationDays: 30,
			referenceIncomeCents: null,
		});
		expect(screen.queryByTestId("confirm-daily")).toBeNull();
		expect(screen.queryByText("Puedes gastar hoy")).toBeNull();
		expect(screen.getByTestId("confirm-income").props.children).toBe("—");
		expect(screen.getByTestId("confirm-envelope-needs").props.children).toBe("50%");
	});

	it("'Empezar mi ciclo' cierra el onboarding y no abre el sheet de ingreso", async () => {
		await renderConfirm(FULL_SEED);
		await act(async () => {
			fireEvent.press(screen.getByText("Empezar mi ciclo"));
		});
		expect(mockSubmit).toHaveBeenCalledTimes(1);
		expect(mockReplace).toHaveBeenCalledWith("/(tabs)");
		expect(screen.queryByText("Registrar ingreso")).toBeNull();
		expect(screen.queryByText("¿Cuánto dinero tienes hoy?")).toBeNull();
		expect(screen.queryByText("Dinero de hoy")).toBeTruthy();
	});

	it("muestra el error de cada campo y deja reintentar", async () => {
		await renderConfirm({
			...FULL_SEED,
			cycleFieldErrors: {
				openingBalanceCents: "El saldo debe ser un entero de céntimos mayor o igual a cero.",
				nextPayDate: "Tu próxima fecha de cobro debe estar entre mañana y los próximos 31 días.",
			},
		});
		expect(screen.getByTestId("field-error-openingBalanceCents")).toBeTruthy();
		expect(screen.getByTestId("field-error-nextPayDate")).toBeTruthy();
		await act(async () => {
			fireEvent.press(screen.getByText("Reintentar"));
		});
		expect(mockSubmit).toHaveBeenCalledTimes(1);
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

	it("el back regresa a compromisos", async () => {
		await renderConfirm(FULL_SEED);
		await act(async () => {
			fireEvent.press(screen.getByTestId("wizard-back"));
		});
		expect(screen.getByTestId("probe-step").props.children).toBe("4");
	});
});
