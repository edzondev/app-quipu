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
		expect(screen.getByText("TU SISTEMA · 04/05")).toBeTruthy();
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

	async function fill(index: number, amount: string, day: string) {
		await act(async () => {
			fireEvent.changeText(screen.getByTestId(`commitment-amount-${index}`), amount);
		});
		await act(async () => {
			fireEvent.changeText(screen.getByTestId(`commitment-day-${index}`), day);
		});
	}

	async function pressContinue() {
		await act(async () => {
			fireEvent.press(screen.getByText("Continuar"));
		});
	}

	it("una fila a medio llenar no se descarta en silencio: marca qué falta y no avanza", async () => {
		await renderStep4();
		await pressChip("Agua");
		await fill(0, "1100", "5");
		await pressChip("Celular");
		await act(async () => {
			fireEvent.changeText(screen.getByTestId("commitment-amount-1"), "96");
		});

		await pressContinue();

		expect(screen.getByTestId("probe-step").props.children).toBe("4");
		expect(screen.getByTestId("commitment-error-dueDay-1").props.children).toBe(
			"Indica el día del mes en que vence.",
		);
		expect(screen.queryByTestId("commitment-error-amountRaw-1")).toBeNull();
		expect(screen.queryByTestId("commitment-error-dueDay-0")).toBeNull();
		expect(screen.getByTestId("commitments-blocked")).toBeTruthy();
		expect(getCommitments()).toHaveLength(0);
	});

	it("completar la fila pendiente quita los errores y deja continuar con todo guardado", async () => {
		await renderStep4();
		await pressChip("Agua");
		await fill(0, "1100", "5");
		await pressChip("Celular");
		await fill(1, "96", "");
		await pressContinue();
		expect(screen.getByTestId("probe-step").props.children).toBe("4");

		await act(async () => {
			fireEvent.changeText(screen.getByTestId("commitment-day-1"), "10");
		});
		expect(screen.queryByTestId("commitment-error-dueDay-1")).toBeNull();
		expect(screen.queryByTestId("commitments-blocked")).toBeNull();

		await pressContinue();
		expect(screen.getByTestId("probe-step").props.children).toBe("5");
		expect(getCommitments()).toHaveLength(2);
		expect(getCommitments()[0]).toMatchObject({ name: "Agua", amountCents: 110000, dueDay: 5 });
		expect(getCommitments()[1]).toMatchObject({ name: "Celular", amountCents: 9600, dueDay: 10 });
	});

	it("al volver al paso con compromisos ya guardados, uno nuevo recibe un id distinto", async () => {
		function SeedWithTwo() {
			const { dispatch } = useOnboarding();
			useEffect(() => {
				dispatch({
					type: "UPDATE",
					payload: {
						commitments: [
							{ id: "row-1", name: "Agua", amountCents: 110000, dueDay: 5 },
							{ id: "row-2", name: "Celular", amountCents: 9600, dueDay: 10 },
						],
					},
				});
				dispatch({ type: "SET_STEP", payload: 4 });
			}, [dispatch]);
			return null;
		}

		await render(
			<OnboardingProvider>
				<SeedWithTwo />
				<StateProbe />
				<Step4Commitments />
			</OnboardingProvider>,
		);

		expect(screen.getByTestId("commitment-name-0").props.value).toBe("Agua");
		expect(screen.getByTestId("commitment-name-1").props.value).toBe("Celular");
		await pressChip("Gimnasio");
		expect(screen.getByTestId("commitment-name-2").props.value).toBe("Gimnasio");
		expect(screen.getAllByTestId(/^commitment-row-/)).toHaveLength(3);

		await fill(2, "80", "12");
		await pressContinue();
		expect(screen.getByTestId("probe-step").props.children).toBe("5");
		const saved = getCommitments();
		expect(saved).toHaveLength(3);
		expect(new Set(saved.map((row) => row.id)).size).toBe(3);
		expect(saved[2]).toMatchObject({ name: "Gimnasio" });
	});

	it("un día fuera de 1–31 se marca apenas se escribe y bloquea Continuar", async () => {
		await renderStep4();
		await pressChip("Agua");
		await fill(0, "1100", "32");

		expect(screen.getByTestId("commitment-error-dueDay-0").props.children).toBe(
			"El día de vencimiento va del 1 al 31.",
		);
		expect(screen.queryByTestId("commitment-ready-0")).toBeNull();
		expect(screen.getByTestId("commitments-total").props.children).toBe("S/ 0");

		await pressContinue();
		expect(screen.getByTestId("probe-step").props.children).toBe("4");
		expect(getCommitments()).toHaveLength(0);

		await act(async () => {
			fireEvent.changeText(screen.getByTestId("commitment-day-0"), "31");
		});
		expect(screen.queryByTestId("commitment-error-dueDay-0")).toBeNull();
		await pressContinue();
		expect(screen.getByTestId("probe-step").props.children).toBe("5");
		expect(getCommitments()[0]).toMatchObject({ dueDay: 31 });
	});

	it("el día 0 y el monto 0 también son inválidos", async () => {
		await renderStep4();
		await pressChip("Agua");
		await fill(0, "0", "0");
		expect(screen.getByTestId("commitment-error-amountRaw-0").props.children).toBe(
			"El monto debe ser mayor a cero.",
		);
		expect(screen.getByTestId("commitment-error-dueDay-0").props.children).toBe(
			"El día de vencimiento va del 1 al 31.",
		);
	});

	it("sin nombre ni monto ni día, Continuar lo pide todo", async () => {
		await renderStep4();
		await pressChip("Otro");
		await act(async () => {
			fireEvent.changeText(screen.getByTestId("commitment-name-0"), "   ");
		});
		await pressContinue();
		expect(screen.getByTestId("commitment-error-name-0").props.children).toBe("Ponle un nombre.");
		expect(screen.getByTestId("commitment-error-amountRaw-0").props.children).toBe(
			"Indica cuánto pagas.",
		);
		expect(screen.getByTestId("commitment-error-dueDay-0")).toBeTruthy();
		expect(screen.getByTestId("probe-step").props.children).toBe("4");
	});

	it("una fila completa muestra su marca de listo; quitar la fila con errores desbloquea", async () => {
		await renderStep4();
		await pressChip("Agua");
		await fill(0, "1100", "5");
		expect(screen.getByTestId("commitment-ready-0")).toBeTruthy();

		await pressChip("Celular");
		expect(screen.queryByTestId("commitment-ready-1")).toBeNull();
		await pressContinue();
		expect(screen.getByTestId("probe-step").props.children).toBe("4");

		await act(async () => {
			fireEvent.press(screen.getByTestId("remove-commitment-1"));
		});
		expect(screen.queryByTestId("commitments-blocked")).toBeNull();
		await pressContinue();
		expect(screen.getByTestId("probe-step").props.children).toBe("5");
		expect(getCommitments()).toHaveLength(1);
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
		expect(screen.getByTestId("probe-step").props.children).toBe("5");
		expect(getCommitments()).toHaveLength(0);
	});

	it("sin filas, Continuar avanza a confirmar", async () => {
		await renderStep4();
		await act(async () => {
			fireEvent.press(screen.getByText("Continuar"));
		});
		expect(screen.getByTestId("probe-step").props.children).toBe("5");
		expect(getCommitments()).toHaveLength(0);
	});

	it("el back de compromisos regresa al reparto", async () => {
		await renderStep4();
		await act(async () => {
			fireEvent.press(screen.getByTestId("wizard-back"));
		});
		expect(screen.getByTestId("probe-step").props.children).toBe("3");
		expect(mockBack).not.toHaveBeenCalled();
	});
});
