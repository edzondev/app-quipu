import { act, fireEvent, render, screen } from "@testing-library/react-native";
import { type ReactNode, useEffect } from "react";
import { StepConfirm } from "@/modules/onboarding/components/step-confirm";
import { OnboardingProvider, useOnboarding } from "@/modules/onboarding/onboarding-provider";
import type { OnboardingState } from "@/shared/lib/onboarding/types";

const mockCreateProfile = jest.fn();
const mockCreateBulk = jest.fn();
const mockRegisterIncome = jest.fn();

jest.mock("convex/react", () => ({
	useMutation: (mutation: unknown) => {
		const { getFunctionName } = require("convex/server") as typeof import("convex/server");
		const name = getFunctionName(mutation as Parameters<typeof getFunctionName>[0]);
		if (name === "profiles:createProfile") return mockCreateProfile;
		if (name === "fixedCommitments:createCommitmentsBulk") return mockCreateBulk;
		throw new Error(`useMutation inesperado: ${name}`);
	},
}));

jest.mock("expo-router", () => ({
	useRouter: () => ({ replace: jest.fn(), back: jest.fn(), push: jest.fn() }),
}));

jest.mock("@/shared/components/ui/reicon", () => {
	const { View } = require("react-native");
	return {
		ChevronLeft: () => <View />,
		Check: () => <View />,
		X: () => <View />,
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
}));

jest.mock("@/shared/hooks/use-profile-gate", () => ({
	useProfileGate: () => ({ profile: { currencyCode: "PEN" } }),
}));

jest.mock("@/shared/hooks/use-expense-actions", () => ({
	useExpenseActions: () => ({ register: jest.fn() }),
}));

jest.mock("@/shared/hooks/use-income-actions", () => ({
	useIncomeActions: () => ({ register: mockRegisterIncome }),
}));

const SEED: Partial<OnboardingState> = {
	incomeModel: "fixed",
	payFrequency: "monthly",
	referenceIncomeCents: 350000,
	allocationNeeds: 50,
	allocationWants: 30,
	allocationSavings: 20,
	commitments: [
		{ id: "c1", name: "Agua", amountCents: 110000, dueDay: 5 },
		{ id: "c2", name: "Celular", amountCents: 0, dueDay: 0 },
	],
};

function Host() {
	const { dispatch } = useOnboarding();
	useEffect(() => {
		dispatch({ type: "UPDATE", payload: SEED });
		dispatch({ type: "SET_STEP", payload: 4 });
	}, [dispatch]);
	return <StepConfirm />;
}

describe("Empezar mi ciclo", () => {
	beforeEach(() => {
		jest.clearAllMocks();
		mockCreateProfile.mockResolvedValue("profiles_onboarding");
		mockCreateBulk.mockResolvedValue([]);
		mockRegisterIncome.mockResolvedValue(undefined);
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

	it("abre el sheet con el monto de referencia y no registra el ingreso solo", async () => {
		await render(
			<OnboardingProvider>
				<Host />
			</OnboardingProvider>,
		);
		await act(async () => {
			fireEvent.press(screen.getByText("Empezar mi ciclo"));
		});
		expect(mockCreateProfile).toHaveBeenCalledTimes(1);
		expect(mockRegisterIncome).not.toHaveBeenCalled();
		expect(screen.getByText("¿Cuánto tienes hoy para este ciclo?")).toBeTruthy();
		expect(screen.getByText("3500.00")).toBeTruthy();
		expect(screen.queryByText("Todo listo")).toBeNull();
	});
});
