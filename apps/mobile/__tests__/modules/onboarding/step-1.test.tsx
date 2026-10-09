import { act, fireEvent, render, screen } from "@testing-library/react-native";
import { Text } from "react-native";
import { onboardingVariableSources } from "@/__fixtures__/onboarding";
import { Step1IncomeProfile } from "@/modules/onboarding/components/step-1-income-profile";
import { OnboardingProvider, useOnboarding } from "@/modules/onboarding/onboarding-provider";
import { FIXED_FREQ_OPTIONS, INCOME_MODEL_OPTIONS } from "@/shared/lib/onboarding/defaults";

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

function StateProbe() {
	const { state } = useOnboarding();
	return (
		<>
			<Text testID="probe-step">{String(state.step)}</Text>
			<Text testID="probe-model">{String(state.incomeModel)}</Text>
			<Text testID="probe-frequency">{String(state.payFrequency)}</Text>
			<Text testID="probe-sources">{state.variableIncomeSources.join("|")}</Text>
			<Text testID="probe-reference">{String(state.referenceIncomeCents)}</Text>
			<Text testID="probe-mixed">{String(state.mixedFixedAmountCents)}</Text>
		</>
	);
}

async function renderStep1() {
	return render(
		<OnboardingProvider>
			<StateProbe />
			<Step1IncomeProfile />
		</OnboardingProvider>,
	);
}

describe("Step1IncomeProfile", () => {
	beforeEach(() => {
		jest.clearAllMocks();
	});

	it("arranca en 01/05 con Fijo y Mensual, y muestra las opciones de Convex", async () => {
		await renderStep1();
		expect(screen.getByText("TU SISTEMA · 01/05")).toBeTruthy();
		expect(screen.getByText("¿Cuánto dinero tienes hoy?")).toBeTruthy();
		expect(screen.getByTestId("option-fixed").props.accessibilityState).toMatchObject({
			selected: true,
		});
		expect(screen.getByTestId("freq-option-monthly").props.accessibilityState).toMatchObject({
			selected: true,
		});
		expect(screen.getByTestId("check-fixed")).toBeTruthy();
		for (const option of INCOME_MODEL_OPTIONS) {
			expect(screen.getByTestId(`option-${option.value}`)).toBeTruthy();
			expect(screen.getByText(option.description)).toBeTruthy();
		}
		for (const option of FIXED_FREQ_OPTIONS) {
			expect(screen.getByTestId(`freq-option-${option.value}`)).toBeTruthy();
			expect(screen.getAllByText(option.label).length).toBeGreaterThan(0);
		}
		expect(screen.queryByTestId("freq-option-variable")).toBeNull();
		expect(screen.queryByText("DÍA DE PAGO")).toBeNull();
		expect(screen.queryByText("El 1 de cada mes")).toBeNull();
	});

	it("con Fijo y con Mixto el selector de frecuencia no ofrece Variable", async () => {
		await renderStep1();
		expect(screen.queryByTestId("freq-option-variable")).toBeNull();
		await act(async () => {
			fireEvent.press(screen.getByTestId("option-mixed"));
		});
		expect(screen.queryByTestId("freq-option-variable")).toBeNull();
		expect(screen.getByTestId("freq-option-monthly")).toBeTruthy();
		expect(screen.getByTestId("freq-option-biweekly")).toBeTruthy();
		expect(screen.getByTestId("freq-option-weekly")).toBeTruthy();
	});

	it("Variable admite varias fuentes", async () => {
		await renderStep1();
		await act(async () => {
			fireEvent.press(screen.getByTestId("option-variable"));
		});
		expect(screen.queryByTestId("freq-option-monthly")).toBeNull();
		await act(async () => {
			fireEvent.changeText(screen.getByTestId("source-input"), onboardingVariableSources[0]);
		});
		await act(async () => {
			fireEvent.press(screen.getByTestId("add-source"));
		});
		await act(async () => {
			fireEvent.changeText(screen.getByTestId("source-input"), onboardingVariableSources[1]);
		});
		await act(async () => {
			fireEvent.press(screen.getByTestId("add-source"));
		});
		expect(screen.getByTestId("source-chip-0").props.children).toBe(onboardingVariableSources[0]);
		expect(screen.getByTestId("source-chip-1").props.children).toBe(onboardingVariableSources[1]);
		await act(async () => {
			fireEvent.press(screen.getByTestId("cycle-pill-30"));
		});
		await act(async () => {
			fireEvent.press(screen.getByText("Continuar"));
		});
		expect(screen.getByTestId("probe-model").props.children).toBe("variable");
		expect(screen.getByTestId("probe-frequency").props.children).toBe("null");
		expect(screen.getByTestId("probe-sources").props.children).toBe(
			onboardingVariableSources.join("|"),
		);
		expect(screen.getByTestId("probe-step").props.children).toBe("2");
	});

	it("Variable exige ciclo y al menos una fuente", async () => {
		await renderStep1();
		await act(async () => {
			fireEvent.press(screen.getByTestId("option-variable"));
		});
		await act(async () => {
			fireEvent.press(screen.getByText("Continuar"));
		});
		expect(screen.getByTestId("probe-step").props.children).toBe("1");
		await act(async () => {
			fireEvent.changeText(screen.getByTestId("source-input"), "Ventas");
		});
		await act(async () => {
			fireEvent.press(screen.getByTestId("add-source"));
		});
		await act(async () => {
			fireEvent.press(screen.getByText("Continuar"));
		});
		expect(screen.getByTestId("probe-step").props.children).toBe("1");
		await act(async () => {
			fireEvent.press(screen.getByTestId("cycle-pill-15"));
		});
		await act(async () => {
			fireEvent.press(screen.getByText("Continuar"));
		});
		expect(screen.getByTestId("probe-step").props.children).toBe("2");
	});

	it("Mixto exige parte fija y al menos una fuente", async () => {
		await renderStep1();
		await act(async () => {
			fireEvent.press(screen.getByTestId("option-mixed"));
		});
		await act(async () => {
			fireEvent.press(screen.getByText("Continuar"));
		});
		expect(screen.getByTestId("probe-step").props.children).toBe("1");
		await act(async () => {
			fireEvent.changeText(screen.getByTestId("amount-input"), "2500");
		});
		await act(async () => {
			fireEvent.press(screen.getByText("Continuar"));
		});
		expect(screen.getByTestId("probe-step").props.children).toBe("1");
		await act(async () => {
			fireEvent.changeText(screen.getByTestId("source-input"), "Ventas");
		});
		await act(async () => {
			fireEvent.press(screen.getByTestId("add-source"));
		});
		await act(async () => {
			fireEvent.press(screen.getByText("Continuar"));
		});
		expect(screen.getByTestId("probe-step").props.children).toBe("2");
		expect(screen.getByTestId("probe-model").props.children).toBe("mixed");
	});

	it("Mixto no arrastra el monto escrito en Fijo", async () => {
		await renderStep1();
		await act(async () => {
			fireEvent.changeText(screen.getByTestId("amount-input"), "3500");
		});
		await act(async () => {
			fireEvent.press(screen.getByTestId("option-mixed"));
		});
		expect(screen.getByTestId("amount-input").props.value).toBe("");
	});

	it("Mixto no deja el monto de Fijo como ingreso de referencia", async () => {
		await renderStep1();
		await act(async () => {
			fireEvent.changeText(screen.getByTestId("amount-input"), "3500");
		});
		await act(async () => {
			fireEvent.press(screen.getByTestId("option-mixed"));
		});
		await act(async () => {
			fireEvent.changeText(screen.getByTestId("amount-input"), "800");
		});
		await act(async () => {
			fireEvent.changeText(screen.getByTestId("source-input"), "Ventas");
		});
		await act(async () => {
			fireEvent.press(screen.getByTestId("add-source"));
		});
		await act(async () => {
			fireEvent.press(screen.getByRole("button", { name: "Continuar" }));
		});
		expect(screen.getByTestId("probe-model").props.children).toBe("mixed");
		expect(screen.getByTestId("probe-reference").props.children).toBe("null");
		expect(screen.getByTestId("probe-mixed").props.children).toBe("80000");
	});

	it("Continuar se deshabilita si Variable está incompleto", async () => {
		await renderStep1();
		await act(async () => {
			fireEvent.press(screen.getByTestId("option-variable"));
		});
		const continuar = screen.getByRole("button", { name: "Continuar" });
		expect(continuar.props.accessibilityState.disabled).toBe(true);
		await act(async () => {
			fireEvent.press(continuar);
		});
		expect(screen.getByTestId("probe-step").props.children).toBe("1");
	});

	it("volver a tocar Mixto no borra la parte fija", async () => {
		await renderStep1();
		await act(async () => {
			fireEvent.press(screen.getByTestId("option-mixed"));
		});
		await act(async () => {
			fireEvent.changeText(screen.getByTestId("amount-input"), "800");
		});
		await act(async () => {
			fireEvent.press(screen.getByTestId("option-mixed"));
		});
		expect(screen.getByTestId("amount-input").props.value).toContain("800");
	});

	it("Fijo pregunta el dinero de hoy y lo guarda como saldo", async () => {
		await renderStep1();
		expect(screen.getByText("¿Cuánto dinero tienes hoy?")).toBeTruthy();
		await act(async () => {
			fireEvent.changeText(screen.getByTestId("amount-input"), "1500");
		});
		await act(async () => {
			fireEvent.press(screen.getByText("Continuar"));
		});
		expect(screen.getByTestId("probe-reference").props.children).toBe("150000");
	});

	it("Mixto pregunta el dinero de hoy además de la parte fija", async () => {
		await renderStep1();
		await act(async () => {
			fireEvent.press(screen.getByTestId("option-mixed"));
		});
		expect(screen.getByText("¿Cuánto dinero tienes hoy?")).toBeTruthy();
		expect(screen.getByText("PARTE FIJA")).toBeTruthy();
		await act(async () => {
			fireEvent.changeText(screen.getByTestId("amount-input"), "800");
		});
		await act(async () => {
			fireEvent.changeText(screen.getByTestId("opening-balance-input"), "1200");
		});
		await act(async () => {
			fireEvent.changeText(screen.getByTestId("source-input"), "Ventas");
		});
		await act(async () => {
			fireEvent.press(screen.getByTestId("add-source"));
		});
		await act(async () => {
			fireEvent.press(screen.getByText("Continuar"));
		});
		expect(screen.getByTestId("probe-reference").props.children).toBe("120000");
		expect(screen.getByTestId("probe-mixed").props.children).toBe("80000");
	});

	it("Variable pregunta el dinero de hoy antes de seguir", async () => {
		await renderStep1();
		await act(async () => {
			fireEvent.press(screen.getByTestId("option-variable"));
		});
		expect(screen.getByText("¿Cuánto dinero tienes hoy?")).toBeTruthy();
		await act(async () => {
			fireEvent.changeText(screen.getByTestId("opening-balance-input"), "500");
		});
		await act(async () => {
			fireEvent.press(screen.getByTestId("cycle-pill-15"));
		});
		await act(async () => {
			fireEvent.changeText(screen.getByTestId("source-input"), "Ventas");
		});
		await act(async () => {
			fireEvent.press(screen.getByTestId("add-source"));
		});
		await act(async () => {
			fireEvent.press(screen.getByText("Continuar"));
		});
		expect(screen.getByTestId("probe-step").props.children).toBe("2");
		expect(screen.getByTestId("probe-reference").props.children).toBe("50000");
	});

	it("el back en paso 1 navega hacia atrás en el stack", async () => {
		await renderStep1();
		await act(async () => {
			fireEvent.press(screen.getByTestId("wizard-back"));
		});
		expect(mockBack).toHaveBeenCalledTimes(1);
	});
});
