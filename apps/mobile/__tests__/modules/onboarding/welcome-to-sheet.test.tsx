import { act, fireEvent, render, screen } from "@testing-library/react-native";
import type { ReactNode } from "react";
import OnboardingIndexScreen from "@/app/(onboarding)/index";
import SistemaScreen from "@/app/(onboarding)/sistema";

const mockReplace = jest.fn();
const mockGate = {
	isAuthReady: false,
	isLoading: false,
	onboardingComplete: false,
};
let mockFocused = true;

jest.mock("expo-router", () => {
	const { Text } = require("react-native");
	return {
		Redirect: ({ href }: { href: string }) => <Text>{`redirect:${href}`}</Text>,
		router: { replace: (...args: unknown[]) => mockReplace(...args) },
		useRouter: () => ({
			replace: (...args: unknown[]) => mockReplace(...args),
			back: jest.fn(),
			push: jest.fn(),
			canGoBack: () => false,
		}),
		useIsFocused: () => mockFocused,
	};
});

jest.mock("@/shared/hooks/use-profile-gate", () => ({
	useProfileGate: () => ({
		isAuthReady: mockGate.isAuthReady,
		isLoading: mockGate.isLoading,
		profile: mockGate.isAuthReady
			? { onboardingComplete: mockGate.onboardingComplete, currencyCode: "PEN" }
			: null,
	}),
}));

jest.mock("convex/react", () => ({
	useMutation: (mutation: unknown) => {
		const { getFunctionName } = require("convex/server") as typeof import("convex/server");
		const name = getFunctionName(mutation as Parameters<typeof getFunctionName>[0]);
		if (name === "profiles:createProfile") {
			return async () => {
				mockGate.onboardingComplete = true;
				return "profiles_onboarding";
			};
		}
		if (name === "fixedCommitments:createCommitmentsBulk") return jest.fn(async () => []);
		throw new Error(`useMutation inesperado: ${name}`);
	},
}));

jest.mock("@/shared/components/ui/reicon", () => {
	const { View } = require("react-native");
	return {
		Check: () => <View />,
		ChevronLeft: () => <View />,
		X: () => <View />,
	};
});

jest.mock("@expo/ui/community/slider", () => {
	const { View } = require("react-native");
	return { Slider: () => <View /> };
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

jest.mock("@/shared/hooks/use-expense-actions", () => ({
	useExpenseActions: () => ({ register: jest.fn() }),
}));

jest.mock("@/shared/hooks/use-income-actions", () => ({
	useIncomeActions: () => ({ register: jest.fn() }),
}));

function Stack({ sistema }: { sistema: boolean }) {
	return (
		<>
			<OnboardingIndexScreen />
			{sistema ? <SistemaScreen /> : null}
		</>
	);
}

describe("Welcome → sistema → sheet", () => {
	beforeEach(() => {
		jest.clearAllMocks();
		mockGate.isAuthReady = false;
		mockGate.isLoading = false;
		mockGate.onboardingComplete = false;
		mockFocused = true;
	});

	it("no va a Inicio antes de que se abra el sheet", async () => {
		const view = await render(<Stack sistema={false} />);
		expect(screen.getByText("Divide tu dinero antes de gastarlo")).toBeTruthy();
		expect(mockReplace).not.toHaveBeenCalled();

		mockGate.isAuthReady = true;
		mockFocused = false;
		await view.rerender(<Stack sistema={true} />);
		expect(screen.getByText("redirect:/(onboarding)/sistema")).toBeTruthy();
		expect(screen.getByText("¿Cómo entra tu dinero?")).toBeTruthy();

		await act(async () => {
			fireEvent.press(screen.getByText("Continuar"));
		});
		await act(async () => {
			fireEvent.press(screen.getByText("Continuar"));
		});
		await act(async () => {
			fireEvent.press(screen.getByText("Continuar"));
		});
		expect(screen.getByText("Puedes gastar hoy")).toBeTruthy();

		await act(async () => {
			fireEvent.press(screen.getByText("Empezar mi ciclo"));
		});
		expect(screen.getByText("Registrar ingreso")).toBeTruthy();
		expect(screen.getByText("¿Cuánto dinero tienes hoy?")).toBeTruthy();
		expect(mockReplace).not.toHaveBeenCalled();
	});
});
