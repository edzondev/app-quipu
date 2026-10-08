import { act, fireEvent, render, screen } from "@testing-library/react-native";
import { useEffect } from "react";
import { Text } from "react-native";
import { Step2System } from "@/modules/onboarding/components/step-2-system";
import { OnboardingProvider, useOnboarding } from "@/modules/onboarding/onboarding-provider";
import type { IncomeModel } from "@/shared/lib/onboarding/types";

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

function SeedModel({ model }: { model: IncomeModel }) {
	const { dispatch } = useOnboarding();
	useEffect(() => {
		dispatch({ type: "UPDATE", payload: { incomeModel: model } });
		dispatch({ type: "SET_STEP", payload: 2 });
	}, [dispatch, model]);
	return null;
}

function StateProbe() {
	const { state } = useOnboarding();
	return (
		<>
			<Text testID="probe-step">{String(state.step)}</Text>
			<Text testID="probe-frequency">{String(state.payFrequency)}</Text>
			<Text testID="probe-reference">{String(state.referenceIncomeCents)}</Text>
			<Text testID="probe-cycle-days">{String(state.cycleDurationDays)}</Text>
			<Text testID="probe-sources">{state.variableIncomeSources.length}</Text>
			<Text testID="probe-mixed-fixed">{String(state.mixedFixedAmountCents)}</Text>
		</>
	);
}

async function renderStep2(model: IncomeModel) {
	return render(
		<OnboardingProvider>
			<SeedModel model={model} />
			<StateProbe />
			<Step2System />
		</OnboardingProvider>,
	);
}

async function pickFrequency(option: "monthly" | "biweekly" | "weekly") {
	await act(async () => {
		fireEvent.press(screen.getByTestId(`freq-option-${option}`));
	});
}

describe("Step2System — fijo", () => {
	beforeEach(() => {
		jest.clearAllMocks();
	});

	it("muestra el header del paso 02 y el frequency picker", async () => {
		await renderStep2("fixed");
		expect(screen.getByText("TU SISTEMA · 02/04")).toBeTruthy();
		expect(screen.getByTestId("freq-option-monthly")).toBeTruthy();
		expect(screen.getByTestId("freq-option-biweekly")).toBeTruthy();
		expect(screen.getByTestId("freq-option-weekly")).toBeTruthy();
	});

	it("fijo + quincenal: NO muestra inputs de días y Continuar avanza a paso 3", async () => {
		await renderStep2("fixed");
		expect(screen.queryByTestId("cycle-pill-15")).toBeNull();
		expect(screen.queryByTestId("cycle-pill-30")).toBeNull();
		await pickFrequency("biweekly");
		expect(screen.getByText("El 15 y 30 de cada mes")).toBeTruthy();
		await act(async () => {
			fireEvent.press(screen.getByText("Continuar"));
		});
		expect(screen.getByTestId("probe-step").props.children).toBe("3");
		expect(screen.getByTestId("probe-frequency").props.children).toBe("biweekly");
	});

	it("escribir 3500 en el monto guarda 350000 céntimos al continuar", async () => {
		await renderStep2("fixed");
		await pickFrequency("monthly");
		await act(async () => {
			fireEvent.changeText(screen.getByTestId("amount-input"), "3500");
		});
		await act(async () => {
			fireEvent.press(screen.getByText("Continuar"));
		});
		expect(screen.getByTestId("probe-reference").props.children).toBe("350000");
	});

	it("el monto de referencia es opcional: Continuar funciona sin monto", async () => {
		await renderStep2("fixed");
		await pickFrequency("monthly");
		await act(async () => {
			fireEvent.press(screen.getByText("Continuar"));
		});
		expect(screen.getByTestId("probe-step").props.children).toBe("3");
		expect(screen.getByTestId("probe-reference").props.children).toBe("null");
	});

	it("preview mensual: TU CICLO SERÍA · 1 – 30 de cada mes · 30 DÍAS", async () => {
		await renderStep2("fixed");
		await pickFrequency("monthly");
		expect(screen.getByText("TU CICLO SERÍA")).toBeTruthy();
		expect(screen.getByText("1 – 30 de cada mes · 30 DÍAS")).toBeTruthy();
	});

	it("preview quincenal y semanal según frecuencia", async () => {
		await renderStep2("fixed");
		await pickFrequency("biweekly");
		expect(screen.getByText("1 – 15 / 16 – 30 · 15 DÍAS")).toBeTruthy();
		await pickFrequency("weekly");
		expect(screen.getByText("7 DÍAS")).toBeTruthy();
	});

	it("sin frecuencia elegida, Continuar está deshabilitado", async () => {
		await renderStep2("fixed");
		await act(async () => {
			fireEvent.press(screen.getByText("Continuar"));
		});
		expect(screen.getByTestId("probe-step").props.children).toBe("2");
	});

	it("muestra FREQ_DRIFT_COPY y el helper del monto", async () => {
		await renderStep2("fixed");
		await pickFrequency("monthly");
		expect(
			screen.getByText(
				"El día de pago es una referencia. Si tu pago real llega antes o después, el ciclo se ajusta a la fecha en que registres tu ingreso.",
			),
		).toBeTruthy();
		expect(
			screen.getByText(
				"Es solo una referencia para armar el primer ciclo. Cuando registres tu ingreso real, Quipu recalcula.",
			),
		).toBeTruthy();
	});
});

describe("Step2System — variable", () => {
	beforeEach(() => {
		jest.clearAllMocks();
	});

	it("requiere duración de ciclo y al menos una fuente", async () => {
		await renderStep2("variable");
		await act(async () => {
			fireEvent.press(screen.getByText("Continuar"));
		});
		expect(screen.getByTestId("probe-step").props.children).toBe("2");

		await act(async () => {
			fireEvent.press(screen.getByTestId("cycle-pill-30"));
		});
		await act(async () => {
			fireEvent.press(screen.getByText("Continuar"));
		});
		expect(screen.getByTestId("probe-step").props.children).toBe("2");

		await act(async () => {
			fireEvent.changeText(screen.getByTestId("source-input"), "Recibos por honorarios");
		});
		await act(async () => {
			fireEvent.press(screen.getByTestId("add-source"));
		});
		await act(async () => {
			fireEvent.press(screen.getByText("Continuar"));
		});
		expect(screen.getByTestId("probe-step").props.children).toBe("3");
		expect(screen.getByTestId("probe-cycle-days").props.children).toBe("30");
		expect(screen.getByTestId("probe-sources").props.children).toBe(1);
		expect(screen.getByTestId("probe-frequency").props.children).toBe("null");
	});

	it("agrega y elimina chips de fuentes, y trunca a 30 caracteres", async () => {
		await renderStep2("variable");
		const input = screen.getByTestId("source-input");
		await act(async () => {
			fireEvent.changeText(input, "Freelance");
		});
		await act(async () => {
			fireEvent.press(screen.getByTestId("add-source"));
		});
		expect(screen.getByTestId("source-chip-0").props.children).toBe("Freelance");

		await act(async () => {
			fireEvent.changeText(input, "Una fuente de ingreso con nombre demasiado largo para el");
		});
		expect(screen.getByTestId("source-input").props.value.length).toBeLessThanOrEqual(30);

		await act(async () => {
			fireEvent.press(screen.getByTestId("remove-source-0"));
		});
		expect(screen.queryByTestId("source-chip-0")).toBeNull();
	});

	it("no muestra el frequency picker ni el monto de referencia", async () => {
		await renderStep2("variable");
		expect(screen.queryByTestId("freq-option-monthly")).toBeNull();
		expect(screen.queryByTestId("amount-input")).toBeNull();
	});
});

describe("Step2System — mixto", () => {
	beforeEach(() => {
		jest.clearAllMocks();
	});

	it("requiere frecuencia + parte fija + fuente, y dispatcha todo junto", async () => {
		await renderStep2("mixed");
		await act(async () => {
			fireEvent.press(screen.getByText("Continuar"));
		});
		expect(screen.getByTestId("probe-step").props.children).toBe("2");

		await pickFrequency("monthly");
		await act(async () => {
			fireEvent.changeText(screen.getByTestId("amount-input"), "2500");
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
		expect(screen.getByTestId("probe-step").props.children).toBe("3");
		expect(screen.getByTestId("probe-frequency").props.children).toBe("monthly");
		expect(screen.getByTestId("probe-mixed-fixed").props.children).toBe("250000");
		expect(screen.getByTestId("probe-sources").props.children).toBe(1);
	});
});

describe("Step2System — shell", () => {
	beforeEach(() => {
		jest.clearAllMocks();
	});

	it("el back del paso 2 regresa al paso 1 (SET_STEP 1)", async () => {
		await renderStep2("fixed");
		await act(async () => {
			fireEvent.press(screen.getByTestId("wizard-back"));
		});
		expect(screen.getByTestId("probe-step").props.children).toBe("1");
		expect(mockBack).not.toHaveBeenCalled();
	});
});
