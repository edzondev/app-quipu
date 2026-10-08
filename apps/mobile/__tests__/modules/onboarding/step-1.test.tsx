import { act, fireEvent, render, screen } from "@testing-library/react-native";
import { Text } from "react-native";
import { Step1IncomeProfile } from "@/modules/onboarding/components/step-1-income-profile";
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

function StateProbe() {
	const { state } = useOnboarding();
	return (
		<>
			<Text testID="probe-step">{String(state.step)}</Text>
			<Text testID="probe-model">{String(state.incomeModel)}</Text>
		</>
	);
}

function renderStep1() {
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

	it("renderiza el header del wizard y las 3 opciones", async () => {
		await renderStep1();
		expect(screen.getByText("TU SISTEMA · 01/04")).toBeTruthy();
		expect(screen.getByText("Fijo")).toBeTruthy();
		expect(screen.getByText("Variable")).toBeTruthy();
		expect(screen.getByText("Mixto")).toBeTruthy();
		expect(screen.getByText("Continuar")).toBeTruthy();
	});

	it("el paso 1 llena solo la primera barra de progreso", async () => {
		await renderStep1();
		expect(screen.getByTestId("wizard-progress-1").props.className).toContain("bg-primary");
		expect(screen.getByTestId("wizard-progress-4").props.className).toContain("bg-line");
	});

	it("Continuar no dispatcha nada sin selección", async () => {
		await renderStep1();
		await act(async () => {
			fireEvent.press(screen.getByText("Continuar"));
		});
		expect(screen.getByTestId("probe-step").props.children).toBe("1");
		expect(screen.getByTestId("probe-model").props.children).toBe("null");
	});

	it("seleccionar Fijo lo marca con borde primary, fondo primary/5 y check", async () => {
		await renderStep1();
		expect(screen.queryByTestId("check-fixed")).toBeNull();
		await act(async () => {
			fireEvent.press(screen.getByTestId("option-fixed"));
		});
		expect(screen.getByTestId("option-fixed").props.className).toContain("border-primary");
		expect(screen.getByTestId("option-fixed").props.className).toContain("bg-primary/5");
		expect(screen.getByTestId("check-fixed")).toBeTruthy();
		expect(screen.getByTestId("icon-check")).toBeTruthy();
		expect(screen.queryByTestId("check-variable")).toBeNull();
	});

	it("la nota variable solo aparece con Variable seleccionado", async () => {
		await renderStep1();
		expect(
			screen.queryByText(
				"Con ingresos variables, Quipu calcula el disponible sobre lo que ya recibiste, nunca sobre lo que esperas recibir.",
			),
		).toBeNull();
		await act(async () => {
			fireEvent.press(screen.getByTestId("option-variable"));
		});
		expect(
			screen.getByText(
				"Con ingresos variables, Quipu calcula el disponible sobre lo que ya recibiste, nunca sobre lo que esperas recibir.",
			),
		).toBeTruthy();
	});

	it("con selección, Continuar dispatcha UPDATE { incomeModel } y avanza a paso 2", async () => {
		await renderStep1();
		await act(async () => {
			fireEvent.press(screen.getByTestId("option-mixed"));
		});
		await act(async () => {
			fireEvent.press(screen.getByText("Continuar"));
		});
		expect(screen.getByTestId("probe-step").props.children).toBe("2");
		expect(screen.getByTestId("probe-model").props.children).toBe("mixed");
	});

	it("el back en paso 1 navega hacia atrás en el stack (router.back)", async () => {
		await renderStep1();
		await act(async () => {
			fireEvent.press(screen.getByTestId("wizard-back"));
		});
		expect(mockBack).toHaveBeenCalledTimes(1);
	});
});
