import { render } from "@testing-library/react-native";
import OnboardingIndexScreen from "@/app/(onboarding)/index";

const mockReplace = jest.fn();
let mockFocused = false;

jest.mock("expo-router", () => ({
	Redirect: () => null,
	router: {
		replace: (...args: unknown[]) => mockReplace(...args),
	},
	useIsFocused: () => mockFocused,
}));

jest.mock("@/shared/hooks/use-profile-gate", () => ({
	useProfileGate: () => ({
		isAuthReady: true,
		isLoading: false,
		profile: { onboardingComplete: true },
	}),
}));

describe("OnboardingIndexScreen", () => {
	beforeEach(() => {
		jest.clearAllMocks();
		mockFocused = false;
	});

	it("sin foco no navega a Inicio aunque el onboarding ya esté completo", async () => {
		await render(<OnboardingIndexScreen />);
		expect(mockReplace).not.toHaveBeenCalled();
	});
});
