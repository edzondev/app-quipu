import { act, fireEvent, render, screen } from "@testing-library/react-native";
import { useEffect } from "react";
import { Text } from "react-native";
import { Step4Commitments } from "@/modules/onboarding/components/step-4-commitments";
import { OnboardingProvider, useOnboarding } from "@/modules/onboarding/onboarding-provider";
import type { DraftCommitment } from "@/shared/lib/onboarding/types";

const mockCreateBulk = jest.fn();

jest.mock("convex/react", () => ({
	useMutation: () => mockCreateBulk,
}));

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
		X: () => <View testID="icon-x" />,
	};
});

function SeedState() {
	const { dispatch } = useOnboarding();
	useEffect(() => {
		dispatch({ type: "SET_STEP", payload: 4 });
	}, [dispatch]);
	return null;
}

function StateProbe() {
	const { state } = useOnboarding();
	return (
		<>
			<Text testID="probe-step">{String(state.step)}</Text>
			<Text testID="probe-commitments">{JSON.stringify(state.commitments)}</Text>
		</>
	);
}

function getCommitments(): DraftCommitment[] {
	return JSON.parse(screen.getByTestId("probe-commitments").props.children) as DraftCommitment[];
}

async function renderStep4() {
	return render(
		<OnboardingProvider>
			<SeedState />
			<StateProbe />
			<Step4Commitments />
		</OnboardingProvider>,
	);
}

async function pressChip(name: string) {
	await act(async () => {
		fireEvent.press(screen.getByTestId(`chip-${name.toLowerCase()}`));
	});
}

describe("Step4Commitments — compromisos", () => {
	beforeEach(() => {
		jest.clearAllMocks();
	});

	it("muestra el header del paso 03, los chips y el total", async () => {
		await renderStep4();
		expect(screen.getByText("TU SISTEMA · 03/04")).toBeTruthy();
		expect(screen.getByText("¿Qué pagas todos los meses?")).toBeTruthy();
		expect(
			screen.getByText("Los reservamos de Necesidades para que nunca aparezcan como sorpresa."),
		).toBeTruthy();
		expect(screen.getByTestId("chip-agua")).toBeTruthy();
		expect(screen.getByTestId("chip-celular")).toBeTruthy();
		expect(screen.getByTestId("chip-gimnasio")).toBeTruthy();
		expect(screen.getByTestId("chip-streaming")).toBeTruthy();
		expect(screen.getByTestId("chip-otro")).toBeTruthy();
		expect(screen.getByText("Se reserva de Necesidades")).toBeTruthy();
		expect(screen.getByTestId("commitments-total").props.children).toBe("S/ 0");
	});

	it("tocar el chip '+ Agua' agrega una fila con nombre Agua vacía", async () => {
		await renderStep4();
		await pressChip("Agua");
		expect(screen.getByTestId("commitment-name-0").props.value).toBe("Agua");
		expect(screen.getByTestId("commitment-amount-0").props.value).toBe("");
		expect(screen.getByTestId("commitment-day-0").props.value).toBe("");
		expect(screen.getByTestId("commitments-total").props.children).toBe("S/ 0");
		expect(getCommitments()).toHaveLength(0);
	});

	it("editar monto 1100 y día 5 actualiza el total", async () => {
		await renderStep4();
		await pressChip("Agua");
		await act(async () => {
			fireEvent.changeText(screen.getByTestId("commitment-amount-0"), "1100");
		});
		await act(async () => {
			fireEvent.changeText(screen.getByTestId("commitment-day-0"), "5");
		});
		expect(screen.getByTestId("commitment-name-0").props.value).toBe("Agua");
		expect(screen.getByTestId("commitments-total").props.children).toBe("S/ 1,100");
	});

	it("editar el nombre actualiza la fila", async () => {
		await renderStep4();
		await pressChip("Otro");
		await act(async () => {
			fireEvent.changeText(screen.getByTestId("commitment-name-0"), "Seguro de vida");
		});
		expect(screen.getByTestId("commitment-name-0").props.value).toBe("Seguro de vida");
	});

	it("el icono X elimina la fila", async () => {
		await renderStep4();
		await pressChip("Agua");
		await pressChip("Celular");
		expect(screen.getByTestId("commitment-name-1").props.value).toBe("Celular");
		await act(async () => {
			fireEvent.press(screen.getByTestId("remove-commitment-0"));
		});
		expect(screen.getByTestId("commitment-name-0").props.value).toBe("Celular");
		expect(screen.queryByTestId("commitment-row-1")).toBeNull();
	});

	it("suma solo filas válidas: Se reserva de Necesidades S/ 1,265", async () => {
		await renderStep4();

		await pressChip("Agua");
		await act(async () => {
			fireEvent.changeText(screen.getByTestId("commitment-amount-0"), "1100");
		});
		await act(async () => {
			fireEvent.changeText(screen.getByTestId("commitment-day-0"), "5");
		});

		await pressChip("Celular");
		await act(async () => {
			fireEvent.changeText(screen.getByTestId("commitment-amount-1"), "96");
		});
		await act(async () => {
			fireEvent.changeText(screen.getByTestId("commitment-day-1"), "10");
		});

		await pressChip("Streaming");
		await act(async () => {
			fireEvent.changeText(screen.getByTestId("commitment-amount-2"), "69");
		});
		await act(async () => {
			fireEvent.changeText(screen.getByTestId("commitment-day-2"), "15");
		});

		expect(screen.getByTestId("commitments-total").props.children).toBe("S/ 1,265");
	});

	it("con filas a medio llenar, Continuar solo guarda las válidas", async () => {
		await renderStep4();
		await pressChip("Agua");
		await act(async () => {
			fireEvent.changeText(screen.getByTestId("commitment-amount-0"), "1100");
		});
		await act(async () => {
			fireEvent.changeText(screen.getByTestId("commitment-day-0"), "5");
		});
		await pressChip("Celular");
		await act(async () => {
			fireEvent.changeText(screen.getByTestId("commitment-amount-1"), "96");
		});
		await act(async () => {
			fireEvent.press(screen.getByText("Continuar"));
		});
		expect(screen.getByTestId("probe-step").props.children).toBe("4");
		expect(getCommitments()).toHaveLength(1);
		expect(getCommitments()[0]).toMatchObject({ name: "Agua", amountCents: 110000, dueDay: 5 });
	});

	it("'Después' no llama a createCommitmentsBulk y no guarda filas", async () => {
		await renderStep4();
		await pressChip("Agua");
		await act(async () => {
			fireEvent.changeText(screen.getByTestId("commitment-amount-0"), "1100");
		});
		await act(async () => {
			fireEvent.changeText(screen.getByTestId("commitment-day-0"), "5");
		});
		await act(async () => {
			fireEvent.press(screen.getByTestId("commitments-skip"));
		});
		expect(mockCreateBulk).not.toHaveBeenCalled();
		expect(screen.getByTestId("probe-step").props.children).toBe("4");
		expect(getCommitments()).toHaveLength(0);
	});

	it("sin filas, Continuar avanza al paso 4", async () => {
		await renderStep4();
		await act(async () => {
			fireEvent.press(screen.getByText("Continuar"));
		});
		expect(screen.getByTestId("probe-step").props.children).toBe("4");
		expect(getCommitments()).toHaveLength(0);
	});

	it("el back del paso 3 regresa al paso 2", async () => {
		await renderStep4();
		await act(async () => {
			fireEvent.press(screen.getByTestId("wizard-back"));
		});
		expect(screen.getByTestId("probe-step").props.children).toBe("2");
		expect(mockBack).not.toHaveBeenCalled();
	});
});
