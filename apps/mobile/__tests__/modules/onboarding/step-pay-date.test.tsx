import { act, fireEvent, render, screen } from "@testing-library/react-native";
import { useEffect } from "react";
import { Platform, Text } from "react-native";
import { StepPayDate } from "@/modules/onboarding/components/step-pay-date";
import { OnboardingProvider, useOnboarding } from "@/modules/onboarding/onboarding-provider";
import { payDateToPickerDate, pickerDateToPayDate } from "@/shared/lib/onboarding/pay-date";

const NOW = Date.parse("2026-10-09T15:30:00-05:00");

jest.mock("expo-router", () => ({
	useRouter: () => ({ back: jest.fn(), canGoBack: () => true, replace: jest.fn() }),
}));

jest.mock("@/shared/components/ui/reicon", () => {
	const { View } = require("react-native");
	return { ChevronLeft: () => <View testID="icon-back" /> };
});

function Probe() {
	const { state } = useOnboarding();
	return (
		<>
			<Text testID="probe-step">{String(state.step)}</Text>
			<Text testID="probe-date">{String(state.nextPayDate)}</Text>
		</>
	);
}

function SeedError() {
	const { dispatch } = useOnboarding();
	useEffect(() => {
		dispatch({
			type: "UPDATE",
			payload: {
				cycleFieldErrors: {
					nextPayDate: "Tu próxima fecha de cobro debe estar entre mañana y los próximos 31 días.",
				},
			},
		});
	}, [dispatch]);
	return null;
}

describe("¿Cuándo cobras?", () => {
	beforeEach(() => {
		jest.spyOn(Date, "now").mockReturnValue(NOW);
	});

	afterEach(() => {
		jest.restoreAllMocks();
	});

	it("viene justo después del dinero de hoy y limita el picker a Lima", async () => {
		await render(
			<OnboardingProvider>
				<Probe />
				<StepPayDate />
			</OnboardingProvider>,
		);
		expect(screen.getByText("TU SISTEMA · 02/05")).toBeTruthy();
		expect(screen.getByText("¿Cuándo cobras?")).toBeTruthy();
		const picker = screen.getByTestId("pay-date-picker");
		expect(pickerDateToPayDate(picker.props.minimumDate)).toBe("2026-10-10");
		expect(pickerDateToPayDate(picker.props.maximumDate)).toBe("2026-11-09");
		expect(pickerDateToPayDate(picker.props.value)).toBe("2026-10-10");

		await act(async () => {
			picker.props.onValueChange({}, payDateToPickerDate("2026-11-09"));
		});
		await act(async () => {
			picker.props.onValueChange({}, payDateToPickerDate("2026-11-10"));
		});
		await act(async () => {
			fireEvent.press(screen.getByText("Continuar"));
		});
		expect(screen.getByTestId("probe-date").props.children).toBe("2026-11-09");
		expect(screen.getByTestId("probe-step").props.children).toBe("3");
	});

	it("en iOS la fecha es una fila con el selector compacto nativo, sin calendario a la vista", async () => {
		await render(
			<OnboardingProvider>
				<StepPayDate />
			</OnboardingProvider>,
		);
		const picker = screen.getByTestId("pay-date-picker");
		expect(picker.props.display).toBe("compact");
		expect(picker.props.presentation).toBeUndefined();
		expect(screen.getByText("Próximo cobro")).toBeTruthy();
		expect(screen.queryByTestId("pay-date-field")).toBeNull();
	});

	it("en Android tocar la fila abre el diálogo nativo y elegir un día lo cierra", async () => {
		jest.replaceProperty(Platform, "OS", "android");
		await render(
			<OnboardingProvider>
				<Probe />
				<StepPayDate />
			</OnboardingProvider>,
		);
		expect(screen.queryByTestId("pay-date-picker")).toBeNull();
		expect(screen.getByText("10 oct 2026")).toBeTruthy();

		await act(async () => {
			fireEvent.press(screen.getByTestId("pay-date-field"));
		});
		const picker = screen.getByTestId("pay-date-picker");
		expect(picker.props.presentation).toBe("dialog");

		await act(async () => {
			picker.props.onValueChange({}, payDateToPickerDate("2026-10-20"));
		});
		expect(screen.queryByTestId("pay-date-picker")).toBeNull();
		expect(screen.getByText("20 oct 2026")).toBeTruthy();

		await act(async () => {
			fireEvent.press(screen.getByText("Continuar"));
		});
		expect(screen.getByTestId("probe-date").props.children).toBe("2026-10-20");
	});

	it("en Android cancelar el diálogo conserva la fecha", async () => {
		jest.replaceProperty(Platform, "OS", "android");
		await render(
			<OnboardingProvider>
				<StepPayDate />
			</OnboardingProvider>,
		);
		await act(async () => {
			fireEvent.press(screen.getByTestId("pay-date-field"));
		});
		await act(async () => {
			screen.getByTestId("pay-date-picker").props.onDismiss();
		});
		expect(screen.queryByTestId("pay-date-picker")).toBeNull();
		expect(screen.getByText("10 oct 2026")).toBeTruthy();
	});

	it("un día fuera de rango deshabilita Continuar y un día válido lo reactiva", async () => {
		function Gate() {
			const { state, dispatch } = useOnboarding();
			useEffect(() => {
				if (state.nextPayDate !== "2026-10-09") {
					dispatch({ type: "UPDATE", payload: { nextPayDate: "2026-10-09" } });
				}
			}, [dispatch, state.nextPayDate]);
			if (state.nextPayDate !== "2026-10-09") return null;
			return <StepPayDate />;
		}
		await render(
			<OnboardingProvider>
				<Gate />
			</OnboardingProvider>,
		);
		const button = () => screen.getByRole("button", { name: "Continuar" });
		expect(button().props.accessibilityState.disabled).toBe(true);
		expect(screen.getByTestId("field-error-nextPayDate")).toBeTruthy();
		await act(async () => {
			screen
				.getByTestId("pay-date-picker")
				.props.onValueChange({}, payDateToPickerDate("2026-10-10"));
		});
		expect(button().props.accessibilityState.disabled).toBe(false);
		expect(screen.queryByTestId("field-error-nextPayDate")).toBeNull();
	});

	it("muestra el error del servidor en el campo de la fecha", async () => {
		await render(
			<OnboardingProvider>
				<SeedError />
				<StepPayDate />
			</OnboardingProvider>,
		);
		expect(screen.getByTestId("field-error-nextPayDate")).toBeTruthy();
	});
});
