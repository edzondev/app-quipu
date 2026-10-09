import { render } from "@testing-library/react-native";
import SeguridadPage from "@/app/seguridad";

const mockReplace = jest.fn();
const mockRevokeAllAndSignOut = jest.fn();

jest.mock("expo-router", () => ({
	useRouter: () => ({ replace: mockReplace, back: jest.fn() }),
}));

jest.mock("@/shared/components/app-shell", () => {
	const { View } = require("react-native");
	return {
		__esModule: true,
		default: ({ children }: { children: unknown }) => <View>{children}</View>,
	};
});

jest.mock("@/shared/hooks/use-security", () => ({
	useSecurity: () => ({
		status: "ready",
		model: null,
		addPasskey: jest.fn(),
		deletePasskey: jest.fn(),
		revokeSession: jest.fn(),
		revokeAllAndSignOut: mockRevokeAllAndSignOut,
	}),
}));

let onRevokeAll: (() => Promise<unknown>) | null = null;

jest.mock("@/shared/components/settings/security-screen", () => ({
	SecurityScreen: (props: { onRevokeAll: () => Promise<unknown> }) => {
		onRevokeAll = props.onRevokeAll;
		return null;
	},
}));

describe("SeguridadPage", () => {
	beforeEach(() => {
		jest.clearAllMocks();
		onRevokeAll = null;
		mockRevokeAllAndSignOut.mockImplementation(async (goToSignIn: () => void) => {
			goToSignIn();
		});
	});

	it("si el cierre falla, igual navega a la entrada", async () => {
		mockRevokeAllAndSignOut.mockImplementation(async (goToSignIn: () => void) => {
			try {
				throw new Error("falló el cierre");
			} finally {
				goToSignIn();
			}
		});
		await render(<SeguridadPage />);
		await expect(onRevokeAll?.()).rejects.toThrow("falló el cierre");
		expect(mockReplace).toHaveBeenCalledWith("/(onboarding)");
	});
});
