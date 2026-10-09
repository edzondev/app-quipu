import { render, screen } from "@testing-library/react-native";
import type { ReactNode } from "react";
import SistemaScreen from "@/app/(onboarding)/sistema";

const mockGate = {
	isAuthReady: true,
	isLoading: false,
	onboardingComplete: false,
};

jest.mock("@/shared/hooks/use-profile-gate", () => ({
	useProfileGate: () => ({
		isAuthReady: mockGate.isAuthReady,
		isLoading: mockGate.isLoading,
		profile: { onboardingComplete: mockGate.onboardingComplete },
	}),
}));

jest.mock("expo-router", () => {
	const { Text } = require("react-native");
	return {
		Redirect: ({ href }: { href: string }) => <Text>{`redirect:${href}`}</Text>,
		useRouter: () => ({
			back: jest.fn(),
			canGoBack: () => false,
			replace: jest.fn(),
			push: jest.fn(),
		}),
	};
});

jest.mock("@/shared/components/ui/reicon", () => {
	const { View } = require("react-native");
	return {
		Check: () => <View />,
		ChevronLeft: () => <View />,
		X: () => <View />,
	};
});

jest.mock("@expo/ui", () => {
	const { View } = require("react-native");
	return {
		BottomSheet: ({ children }: { children: ReactNode }) => <View>{children}</View>,
		RNHostView: ({ children }: { children: ReactNode }) => <View>{children}</View>,
		ScrollView: ({ children }: { children: ReactNode }) => <View>{children}</View>,
	};
});

describe("gate de sistema", () => {
	beforeEach(() => {
		mockGate.isAuthReady = true;
		mockGate.isLoading = false;
		mockGate.onboardingComplete = false;
	});

	it("no redirige a Inicio mientras el wizard está en curso", async () => {
		const view = await render(<SistemaScreen />);
		expect(screen.getByText("¿Cómo entra tu dinero?")).toBeTruthy();
		expect(screen.queryByText("redirect:/(tabs)")).toBeNull();

		mockGate.onboardingComplete = true;
		view.rerender(<SistemaScreen />);
		expect(screen.getByText("¿Cómo entra tu dinero?")).toBeTruthy();
		expect(screen.queryByText("redirect:/(tabs)")).toBeNull();
	});

	it("si el onboarding ya estaba completo al entrar, va a Inicio", async () => {
		mockGate.onboardingComplete = true;
		await render(<SistemaScreen />);
		expect(screen.getByText("redirect:/(tabs)")).toBeTruthy();
		expect(screen.queryByText("¿Cómo entra tu dinero?")).toBeNull();
	});
});
