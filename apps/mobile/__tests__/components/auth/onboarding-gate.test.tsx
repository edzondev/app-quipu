import { render } from "@testing-library/react-native";
import { Text } from "react-native";
import OnboardingGate from "@/shared/components/auth/onboarding-gate";

const mockUseSession = jest.fn();
const mockUseQuery = jest.fn();
const mockUseConvexAuth = jest.fn();

jest.mock("@/lib/auth-client", () => ({
	authClient: {
		useSession: () => mockUseSession(),
	},
}));

jest.mock("convex/react", () => ({
	useQuery: (...args: unknown[]) => mockUseQuery(...args),
	useConvexAuth: () => mockUseConvexAuth(),
}));

jest.mock("expo-router", () => {
	const { Text } = require("react-native");
	return {
		Redirect: ({ href }: { href: string }) => <Text>{`redirect:${href}`}</Text>,
	};
});

function renderGate() {
	return render(
		<OnboardingGate>
			<Text>contenido-protegido</Text>
		</OnboardingGate>,
	);
}

describe("OnboardingGate", () => {
	beforeEach(() => {
		jest.clearAllMocks();
		mockUseConvexAuth.mockReturnValue({
			isAuthenticated: false,
			isLoading: false,
		});
	});

	it("retorna null mientras la sesión está pendiente", async () => {
		mockUseSession.mockReturnValue({ data: null, isPending: true });
		mockUseConvexAuth.mockReturnValue({
			isAuthenticated: false,
			isLoading: true,
		});
		mockUseQuery.mockReturnValue(undefined);
		const { toJSON } = await renderGate();
		expect(toJSON()).toBeNull();
		expect(mockUseQuery).toHaveBeenCalledWith(expect.anything(), "skip");
	});

	it("retorna null mientras Convex no tiene el token (cold start con sesión)", async () => {
		// Sesión de Better Auth ya resuelta, pero la conexión Convex aún
		// no quedó autenticada: no debe decidir (ni redirigir al wizard).
		mockUseSession.mockReturnValue({
			data: { user: { id: "u1" } },
			isPending: false,
		});
		mockUseConvexAuth.mockReturnValue({
			isAuthenticated: false,
			isLoading: true,
		});
		mockUseQuery.mockReturnValue(undefined);
		const { toJSON, queryByText } = await renderGate();
		expect(toJSON()).toBeNull();
		expect(queryByText(/redirect:/)).toBeNull();
		expect(mockUseQuery).toHaveBeenCalledWith(expect.anything(), "skip");
	});

	it("sin sesión redirige a /(onboarding)/index", async () => {
		mockUseSession.mockReturnValue({ data: null, isPending: false });
		mockUseConvexAuth.mockReturnValue({
			isAuthenticated: false,
			isLoading: false,
		});
		mockUseQuery.mockReturnValue(undefined);
		const { getByText } = await renderGate();
		expect(getByText("redirect:/(onboarding)")).toBeTruthy();
		expect(mockUseQuery).toHaveBeenCalledWith(expect.anything(), "skip");
	});

	it("con sesión y profile null redirige a /(onboarding)/sistema", async () => {
		mockUseSession.mockReturnValue({
			data: { user: { id: "u1" } },
			isPending: false,
		});
		mockUseConvexAuth.mockReturnValue({
			isAuthenticated: true,
			isLoading: false,
		});
		mockUseQuery.mockReturnValue(null);
		const { getByText } = await renderGate();
		expect(getByText("redirect:/(onboarding)/sistema")).toBeTruthy();
		expect(mockUseQuery).toHaveBeenCalledWith(expect.anything(), {});
	});

	it("con sesión y profile incompleto redirige a /(onboarding)/sistema", async () => {
		mockUseSession.mockReturnValue({
			data: { user: { id: "u1" } },
			isPending: false,
		});
		mockUseConvexAuth.mockReturnValue({
			isAuthenticated: true,
			isLoading: false,
		});
		mockUseQuery.mockReturnValue({ _id: "p1", onboardingComplete: false });
		const { getByText } = await renderGate();
		expect(getByText("redirect:/(onboarding)/sistema")).toBeTruthy();
	});

	it("con profile con onboardingComplete renderiza los children", async () => {
		mockUseSession.mockReturnValue({
			data: { user: { id: "u1" } },
			isPending: false,
		});
		mockUseConvexAuth.mockReturnValue({
			isAuthenticated: true,
			isLoading: false,
		});
		mockUseQuery.mockReturnValue({ _id: "p1", onboardingComplete: true });
		const { getByText, queryByText } = await renderGate();
		expect(getByText("contenido-protegido")).toBeTruthy();
		expect(queryByText(/redirect:/)).toBeNull();
		expect(mockUseQuery).toHaveBeenCalledWith(expect.anything(), {});
	});
});
