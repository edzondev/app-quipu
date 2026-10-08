import { act, fireEvent, render, screen } from "@testing-library/react-native";
import { useEffect } from "react";
import { Text } from "react-native";
import { StepConfirm } from "@/modules/onboarding/components/step-confirm";
import { OnboardingProvider, useOnboarding } from "@/modules/onboarding/onboarding-provider";
import type { OnboardingState } from "@/shared/lib/onboarding/types";

const mockSubmit = jest.fn();

const hookState = {
	submit: mockSubmit,
	isSubmitting: false,
	error: null as string | null,
};

jest.mock("@/modules/onboarding/use-complete-onboarding", () => ({
	useCompleteOnboarding: () => hookState,
}));

jest.mock("@/shared/components/ui/reicon", () => {
	const { View } = require("react-native");
	return {
		Check: () => <View testID="icon-check" />,
		ChevronLeft: () => <View testID="icon-back" />,
		X: () => <View testID="icon-x" />,
	};
});

function SeedState({ seed }: { seed: Partial<OnboardingState> }) {
	const { dispatch } = useOnboarding();
	useEffect(() => {
		dispatch({ type: "UPDATE", payload: seed });
		dispatch({ type: "SET_STEP", payload: "confirm" });
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

describe("StepConfirm — confirmación del sistema", () => {
	beforeEach(() => {
		jest.clearAllMocks();
		hookState.submit = mockSubmit;
		hookState.isSubmitting = false;
		hookState.error = null;
	});

	it("muestra header, título y la card PODRÁS GASTAR AL DÍA con el cálculo real", async () => {
		await renderConfirm(FULL_SEED);
		expect(screen.getByText("CONFIRMA TU SISTEMA")).toBeTruthy();
		expect(screen.getByText(/^Así queda tu ciclo de /)).toBeTruthy();
		expect(screen.getByText("PODRÁS GASTAR AL DÍA")).toBeTruthy();
		// (350000 - 126500 - 70000) / 30 = 5116 céntimos
		expect(screen.getByTestId("confirm-daily").props.children).toBe("S/ 51.16");
	});

	it("muestra el desglose completo con referencia de ingreso", async () => {
		await renderConfirm(FULL_SEED);
		expect(screen.getByText("Ingreso del ciclo")).toBeTruthy();
		expect(screen.getByTestId("confirm-income").props.children).toBe("S/ 3,500");
		expect(screen.getByText("Necesidades")).toBeTruthy();
		expect(screen.getByTestId("confirm-envelope-needs").props.children).toBe("50% · S/ 1,750");
		expect(screen.getByTestId("confirm-envelope-wants").props.children).toBe("30% · S/ 1,050");
		expect(screen.getByTestId("confirm-envelope-savings").props.children).toBe("20% · S/ 700");
		expect(screen.getByText("Compromisos reservados")).toBeTruthy();
		expect(screen.getByTestId("confirm-commitments").props.children).toBe("S/ 1,265");
		expect(
			screen.getByText(
				"Puedes cambiar cualquiera de estos números después, desde Ajustes · Tu sistema.",
			),
		).toBeTruthy();
	});

	it("sin referencia de ingreso: card con —, hint, ingreso — y sobres solo con %", async () => {
		await renderConfirm({
			incomeModel: "variable",
			cycleDurationDays: 30,
			referenceIncomeCents: null,
		});
		expect(screen.getByTestId("confirm-daily").props.children).toBe("—");
		expect(
			screen.getByText("Registra tu primer ingreso para ver tu disponible al día."),
		).toBeTruthy();
		expect(screen.getByTestId("confirm-income").props.children).toBe("—");
		expect(screen.getByTestId("confirm-envelope-needs").props.children).toBe("50%");
		expect(screen.queryByTestId("confirm-error")).toBeNull();
	});

	it("'Empezar mi ciclo' llama submit", async () => {
		await renderConfirm(FULL_SEED);
		await act(async () => {
			fireEvent.press(screen.getByTestId("confirm-submit"));
		});
		expect(mockSubmit).toHaveBeenCalledTimes(1);
	});

	it("con isSubmitting muestra 'Creando…' y deshabilita el CTA", async () => {
		hookState.isSubmitting = true;
		await renderConfirm(FULL_SEED);
		expect(screen.getByTestId("confirm-submit").props.accessibilityState.disabled).toBe(true);
		expect(screen.getByText("Creando…")).toBeTruthy();
		await act(async () => {
			fireEvent.press(screen.getByTestId("confirm-submit"));
		});
		expect(mockSubmit).not.toHaveBeenCalled();
	});

	it("renderiza el error del hook", async () => {
		hookState.error = "No se pudo crear tu sistema. Intenta de nuevo.";
		await renderConfirm(FULL_SEED);
		expect(screen.getByText("No se pudo crear tu sistema. Intenta de nuevo.")).toBeTruthy();
	});

	it("'Ajustar algo' vuelve al paso 3", async () => {
		await renderConfirm(FULL_SEED);
		await act(async () => {
			fireEvent.press(screen.getByTestId("confirm-adjust"));
		});
		expect(screen.getByTestId("probe-step").props.children).toBe("3");
	});

	it("el back regresa al paso 4", async () => {
		await renderConfirm(FULL_SEED);
		await act(async () => {
			fireEvent.press(screen.getByTestId("confirm-back"));
		});
		expect(screen.getByTestId("probe-step").props.children).toBe("4");
	});
});
