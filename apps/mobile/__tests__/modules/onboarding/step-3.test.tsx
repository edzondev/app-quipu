import { act, fireEvent, render, screen } from "@testing-library/react-native";
import { useEffect } from "react";
import { Text } from "react-native";
import { Step3Allocation } from "@/modules/onboarding/components/step-3-allocation";
import { OnboardingProvider, useOnboarding } from "@/modules/onboarding/onboarding-provider";

const mockBack = jest.fn();
const mockReplace = jest.fn();

jest.mock("expo-router", () => ({
	useRouter: () => ({
		back: mockBack,
		canGoBack: () => true,
		replace: mockReplace,
	}),
}));

jest.mock("@/shared/components/ui/reicon", () => {
	const { View } = require("react-native");
	return {
		Check: () => <View testID="icon-check" />,
		ChevronLeft: () => <View testID="icon-back" />,
	};
});

/** Un toque por `act`: cada uno parte del estado que dejó el anterior, como el dedo. */
async function press(testId: string, times = 1) {
	for (let i = 0; i < times; i++) {
		await act(async () => {
			fireEvent.press(screen.getByTestId(testId));
		});
	}
}

function SeedState({ reference }: { reference: number | null }) {
	const { dispatch } = useOnboarding();
	useEffect(() => {
		dispatch({ type: "UPDATE", payload: { referenceIncomeCents: reference } });
		dispatch({ type: "SET_STEP", payload: 3 });
	}, [dispatch, reference]);
	return null;
}

function StateProbe() {
	const { state } = useOnboarding();
	return (
		<>
			<Text testID="probe-step">{String(state.step)}</Text>
			<Text testID="probe-needs">{String(state.allocationNeeds)}</Text>
			<Text testID="probe-wants">{String(state.allocationWants)}</Text>
			<Text testID="probe-savings">{String(state.allocationSavings)}</Text>
		</>
	);
}

async function renderStep3(reference: number | null) {
	return render(
		<OnboardingProvider>
			<SeedState reference={reference} />
			<StateProbe />
			<Step3Allocation />
		</OnboardingProvider>,
	);
}

function probe() {
	return {
		needs: screen.getByTestId("probe-needs").props.children,
		wants: screen.getByTestId("probe-wants").props.children,
		savings: screen.getByTestId("probe-savings").props.children,
	};
}

describe("Step3Allocation — reparto 50/30/20", () => {
	beforeEach(() => {
		jest.clearAllMocks();
	});

	it("muestra el header del paso 03 y las 3 filas, con Ahorro marcado como automático", async () => {
		await renderStep3(null);
		expect(screen.getByText("TU SISTEMA · 03/05")).toBeTruthy();
		expect(screen.getByText("¿Cómo repartes tu dinero?")).toBeTruthy();
		expect(screen.getByText("Necesidades")).toBeTruthy();
		expect(screen.getByText("Gustos")).toBeTruthy();
		expect(screen.getByText("Ahorro")).toBeTruthy();
		expect(screen.getByTestId("allocation-percent-needs").props.children).toBe("50%");
		expect(screen.getByTestId("allocation-percent-wants").props.children).toBe("30%");
		expect(screen.getByTestId("allocation-percent-savings").props.children).toBe("20%");
		expect(screen.getByText("Automático")).toBeTruthy();
		expect(screen.queryByTestId("allocation-increase-savings")).toBeNull();
		expect(screen.queryByTestId("allocation-decrease-savings")).toBeNull();
	});

	it("explica qué entra en cada sobre", async () => {
		await renderStep3(null);
		expect(screen.getByText(/Renta, comida, transporte/)).toBeTruthy();
		expect(screen.getByText(/Salidas, compras y antojos/)).toBeTruthy();
		expect(screen.getByText(/Lo que queda\. Se aparta primero/)).toBeTruthy();
	});

	it("muestra montos S/ junto al % con referencia 350000 (defaults)", async () => {
		await renderStep3(350000);
		expect(screen.getByTestId("allocation-amount-needs").props.children).toBe("S/ 1,750");
		expect(screen.getByTestId("allocation-amount-wants").props.children).toBe("S/ 1,050");
		expect(screen.getByTestId("allocation-amount-savings").props.children).toBe("S/ 700");
	});

	it("sin referencia no muestra montos", async () => {
		await renderStep3(null);
		expect(screen.queryByTestId("allocation-amount-needs")).toBeNull();
		expect(screen.queryByTestId("allocation-amount-wants")).toBeNull();
		expect(screen.queryByTestId("allocation-amount-savings")).toBeNull();
	});

	it("subir Necesidades de a 5 hasta 60 solo cambia Ahorro (60/30/10)", async () => {
		await renderStep3(350000);
		await press("allocation-increase-needs", 2);
		expect(probe()).toEqual({ needs: "60", wants: "30", savings: "10" });
		expect(screen.getByTestId("allocation-percent-savings").props.children).toBe("10%");
		expect(screen.getByTestId("allocation-amount-needs").props.children).toBe("S/ 2,100");
		expect(screen.getByTestId("allocation-amount-wants").props.children).toBe("S/ 1,050");
		expect(screen.getByTestId("allocation-amount-savings").props.children).toBe("S/ 350");
	});

	it("tocar Gustos después no vuelve a mover lo que ya se fijó en Necesidades", async () => {
		await renderStep3(null);
		await press("allocation-increase-needs", 2);
		await press("allocation-decrease-wants", 2);
		expect(probe()).toEqual({ needs: "60", wants: "20", savings: "20" });
	});

	it("la barra refleja el reparto actual", async () => {
		await renderStep3(null);
		await press("allocation-increase-needs", 2);
		expect(screen.getByTestId("allocation-bar-segment-needs").props.style).toMatchObject({
			flexGrow: 60,
		});
		expect(screen.getByTestId("allocation-bar-segment-savings").props.style).toMatchObject({
			flexGrow: 10,
		});
	});

	it("al llegar al tope el botón + se deshabilita y Ahorro queda en 0, nunca negativo", async () => {
		await renderStep3(null);
		await press("allocation-increase-needs", 6);
		expect(probe()).toEqual({ needs: "70", wants: "30", savings: "0" });
		expect(screen.getByTestId("allocation-increase-needs").props.accessibilityState.disabled).toBe(
			true,
		);
		expect(screen.getByTestId("allocation-increase-wants").props.accessibilityState.disabled).toBe(
			true,
		);
	});

	it("en 0 el botón − se deshabilita", async () => {
		await renderStep3(null);
		await press("allocation-decrease-wants", 8);
		expect(probe()).toEqual({ needs: "50", wants: "0", savings: "50" });
		expect(screen.getByTestId("allocation-decrease-wants").props.accessibilityState.disabled).toBe(
			true,
		);
	});

	it("los botones dicen qué sobre mueven y cuánto", async () => {
		await renderStep3(null);
		expect(screen.getByLabelText("Subir Necesidades 5 puntos")).toBeTruthy();
		expect(screen.getByLabelText("Bajar Gustos 5 puntos")).toBeTruthy();
	});

	it("'Volver al 50/30/20' restaura los defaults", async () => {
		await renderStep3(350000);
		await press("allocation-increase-needs", 2);
		expect(probe().needs).toBe("60");
		await act(async () => {
			fireEvent.press(screen.getByTestId("allocation-reset"));
		});
		expect(probe()).toEqual({ needs: "50", wants: "30", savings: "20" });
		expect(screen.getByTestId("allocation-amount-needs").props.children).toBe("S/ 1,750");
	});

	it("Atrás desde el reparto va al paso de cobro", async () => {
		await renderStep3(null);
		await act(async () => {
			fireEvent.press(screen.getByTestId("wizard-back"));
		});
		expect(screen.getByTestId("probe-step").props.children).toBe("2");
	});

	it("Continuar va a compromisos, no a confirmar", async () => {
		await renderStep3(null);
		await act(async () => {
			fireEvent.press(screen.getByText("Continuar"));
		});
		expect(screen.getByTestId("probe-step").props.children).toBe("4");
	});
});
