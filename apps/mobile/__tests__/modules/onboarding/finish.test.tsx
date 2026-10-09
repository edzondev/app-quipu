import { act, fireEvent, render, screen } from "@testing-library/react-native";
import { useEffect } from "react";
import { Pressable } from "react-native";
import { StepConfirm } from "@/modules/onboarding/components/step-confirm";
import { OnboardingProvider, useOnboarding } from "@/modules/onboarding/onboarding-provider";
import type { OnboardingState } from "@/shared/lib/onboarding/types";

const mockCreateProfile = jest.fn();
const mockCreateBulk = jest.fn();
const mockStartFirstCycle = jest.fn();
const mockReplace = jest.fn();

jest.mock("convex/react", () => ({
	useMutation: (mutation: unknown) => {
		const { getFunctionName } = require("convex/server") as typeof import("convex/server");
		const name = getFunctionName(mutation as Parameters<typeof getFunctionName>[0]);
		if (name === "profiles:createProfile") return mockCreateProfile;
		if (name === "fixedCommitments:createCommitmentsBulk") return mockCreateBulk;
		if (name === "firstCycle:startFirstCycle") return mockStartFirstCycle;
		throw new Error(`useMutation inesperado: ${name}`);
	},
}));

jest.mock("expo-router", () => ({
	useRouter: () => ({ replace: mockReplace, back: jest.fn(), push: jest.fn() }),
}));

jest.mock("@/shared/components/ui/reicon", () => {
	const { View } = require("react-native");
	return {
		ChevronLeft: () => <View />,
		Check: () => <View />,
		X: () => <View />,
	};
});

const NOW = Date.parse("2026-10-09T15:30:00-05:00");

const SEED: Partial<OnboardingState> = {
	incomeModel: "fixed",
	payFrequency: "monthly",
	referenceIncomeCents: 350000,
	nextPayDate: "2026-10-20",
	allocationNeeds: 50,
	allocationWants: 30,
	allocationSavings: 20,
	commitments: [
		{ id: "c1", name: "Agua", amountCents: 110000, dueDay: 5 },
		{ id: "c2", name: "Celular", amountCents: 0, dueDay: 0 },
	],
};

function Host({ remount = false }: { remount?: boolean }) {
	const { state, dispatch } = useOnboarding();
	useEffect(() => {
		dispatch({ type: "UPDATE", payload: SEED });
		dispatch({ type: "SET_STEP", payload: 5 });
	}, [dispatch]);
	return (
		<>
			{state.step === 5 ? <StepConfirm /> : null}
			{remount ? (
				<>
					<Pressable
						testID="leave-confirm"
						onPress={() => dispatch({ type: "SET_STEP", payload: 2 })}
					/>
					<Pressable
						testID="go-confirm"
						onPress={() => dispatch({ type: "SET_STEP", payload: 5 })}
					/>
				</>
			) : null}
		</>
	);
}

describe("Empezar mi ciclo", () => {
	beforeEach(() => {
		jest.clearAllMocks();
		jest.spyOn(Date, "now").mockReturnValue(NOW);
		mockCreateProfile.mockResolvedValue("profiles_onboarding");
		mockCreateBulk.mockResolvedValue([]);
		mockStartFirstCycle.mockResolvedValue({ cycleId: "cycle_1" });
	});

	afterEach(() => {
		jest.restoreAllMocks();
	});

	it("si createCommitmentsBulk falla, se ve el error con Reintentar", async () => {
		mockCreateBulk.mockRejectedValue(new Error("Server exploded profileId xyz"));
		await render(
			<OnboardingProvider>
				<Host />
			</OnboardingProvider>,
		);
		await act(async () => {
			fireEvent.press(screen.getByText("Empezar mi ciclo"));
		});
		expect(screen.getByText("No se pudieron guardar los compromisos.")).toBeTruthy();
		expect(screen.getByText("También puedes agregarlos después desde Plan.")).toBeTruthy();
		expect(screen.getByText("Reintentar")).toBeTruthy();
		expect(screen.queryByText(/Server exploded/)).toBeNull();
		expect(screen.queryByText(/profileId/)).toBeNull();
		expect(screen.queryByText("Todo listo")).toBeNull();

		mockCreateBulk.mockResolvedValue([]);
		await act(async () => {
			fireEvent.press(screen.getByText("Reintentar"));
		});
		expect(mockCreateBulk).toHaveBeenCalledTimes(2);
		expect(mockCreateBulk).toHaveBeenLastCalledWith({
			profileId: "profiles_onboarding",
			commitments: [{ name: "Agua", amount: 110000, envelope: "needs", dueDay: 5 }],
		});
	});

	it("un doble toque no llama dos veces a createCommitmentsBulk", async () => {
		let release: (value: unknown) => void = () => undefined;
		mockCreateBulk.mockImplementation(
			() =>
				new Promise((resolve) => {
					release = resolve;
				}),
		);
		await render(
			<OnboardingProvider>
				<Host />
			</OnboardingProvider>,
		);
		await act(async () => {
			fireEvent.press(screen.getByText("Empezar mi ciclo"));
			fireEvent.press(screen.getByText("Empezar mi ciclo"));
		});
		expect(mockCreateBulk).toHaveBeenCalledTimes(1);
		await act(async () => {
			release([]);
		});
		expect(mockCreateBulk).toHaveBeenCalledTimes(1);
		expect(mockStartFirstCycle).toHaveBeenCalledTimes(1);
	});

	it("abre el primer ciclo con el saldo y la fecha, sin registrar un ingreso", async () => {
		await render(
			<OnboardingProvider>
				<Host />
			</OnboardingProvider>,
		);
		await act(async () => {
			fireEvent.press(screen.getByText("Empezar mi ciclo"));
		});
		expect(mockCreateProfile).toHaveBeenCalledTimes(1);
		expect(mockStartFirstCycle).toHaveBeenCalledWith({
			openingBalanceCents: 350000,
			nextPayDate: "2026-10-20",
		});
		expect(mockReplace).toHaveBeenCalledWith("/(tabs)");
		expect(screen.queryByText("Registrar ingreso")).toBeNull();
		expect(screen.queryByText("¿Cuánto dinero tienes hoy?")).toBeNull();
		expect(screen.queryByText("Todo listo")).toBeNull();
	});

	it("VALIDATION_ERROR de la fecha se ve en ese campo y Reintentar vuelve a llamar", async () => {
		mockStartFirstCycle.mockRejectedValueOnce({
			data: {
				code: "VALIDATION_ERROR",
				message: "Tu próxima fecha de cobro debe estar entre mañana y los próximos 31 días.",
				data: { field: "nextPayDate" },
			},
		});
		await render(
			<OnboardingProvider>
				<Host />
			</OnboardingProvider>,
		);
		await act(async () => {
			fireEvent.press(screen.getByText("Empezar mi ciclo"));
		});
		expect(screen.getByTestId("field-error-nextPayDate").props.children).toBe(
			"Tu próxima fecha de cobro debe estar entre mañana y los próximos 31 días.",
		);
		expect(screen.queryByText("Registrar ingreso")).toBeNull();
		expect(mockReplace).not.toHaveBeenCalled();

		mockStartFirstCycle.mockResolvedValue({ cycleId: "cycle_1" });
		await act(async () => {
			fireEvent.press(screen.getByText("Reintentar"));
		});
		expect(mockStartFirstCycle).toHaveBeenCalledTimes(2);
		expect(mockReplace).toHaveBeenCalledWith("/(tabs)");
	});

	it("si el ciclo falla, reintentar no vuelve a crear los compromisos", async () => {
		mockStartFirstCycle.mockRejectedValueOnce(new Error("cycle down"));
		await render(
			<OnboardingProvider>
				<Host />
			</OnboardingProvider>,
		);
		await act(async () => {
			fireEvent.press(screen.getByText("Empezar mi ciclo"));
		});
		expect(mockCreateProfile).toHaveBeenCalledTimes(1);
		expect(mockCreateBulk).toHaveBeenCalledTimes(1);
		await act(async () => {
			fireEvent.press(screen.getByText("Reintentar"));
		});
		expect(mockCreateProfile).toHaveBeenCalledTimes(1);
		expect(mockCreateBulk).toHaveBeenCalledTimes(1);
		expect(mockStartFirstCycle).toHaveBeenCalledTimes(2);
	});

	it("tras un VALIDATION_ERROR, volver y confirmar no duplica compromisos", async () => {
		mockStartFirstCycle.mockRejectedValueOnce({
			data: {
				code: "VALIDATION_ERROR",
				message: "Tu próxima fecha de cobro debe estar entre mañana y los próximos 31 días.",
				data: { field: "nextPayDate" },
			},
		});
		await render(
			<OnboardingProvider>
				<Host remount />
			</OnboardingProvider>,
		);
		await act(async () => {
			fireEvent.press(screen.getByText("Empezar mi ciclo"));
		});
		expect(mockCreateBulk).toHaveBeenCalledTimes(1);
		await act(async () => {
			fireEvent.press(screen.getByTestId("leave-confirm"));
		});
		expect(screen.queryByText("Empezar mi ciclo")).toBeNull();
		await act(async () => {
			fireEvent.press(screen.getByTestId("go-confirm"));
		});
		await act(async () => {
			fireEvent.press(screen.getByText("Empezar mi ciclo"));
		});
		expect(mockCreateProfile).toHaveBeenCalledTimes(1);
		expect(mockCreateBulk).toHaveBeenCalledTimes(1);
		expect(mockStartFirstCycle).toHaveBeenCalledTimes(2);
	});

	it("ALREADY_EXISTS sigue a Inicio", async () => {
		mockStartFirstCycle.mockRejectedValue({
			data: { code: "ALREADY_EXISTS", message: "Tu primer ciclo ya está creado." },
		});
		await render(
			<OnboardingProvider>
				<Host />
			</OnboardingProvider>,
		);
		await act(async () => {
			fireEvent.press(screen.getByText("Empezar mi ciclo"));
		});
		expect(mockReplace).toHaveBeenCalledWith("/(tabs)");
		expect(screen.queryByText("Tu primer ciclo ya está creado.")).toBeNull();
		expect(screen.queryByTestId("confirm-retry")).toBeNull();
	});
});
