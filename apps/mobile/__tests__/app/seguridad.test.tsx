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
	});

	it("si el servidor se enteró, va a la entrada", async () => {
		mockRevokeAllAndSignOut.mockResolvedValue(true);
		await render(<SeguridadPage />);
		await onRevokeAll?.();
		expect(mockReplace).toHaveBeenCalledWith("/(onboarding)");
	});

	it("si el servidor no se enteró, va a la entrada con el aviso offline", async () => {
		mockRevokeAllAndSignOut.mockResolvedValue(false);
		await render(<SeguridadPage />);
		await onRevokeAll?.();
		expect(mockReplace).toHaveBeenCalledWith({
			pathname: "/(onboarding)",
			params: { notice: "offline" },
		});
	});

	it("si el cierre falla, no navega", async () => {
		mockRevokeAllAndSignOut.mockRejectedValue(new Error("falló el cierre"));
		await render(<SeguridadPage />);
		await expect(onRevokeAll?.()).rejects.toThrow("falló el cierre");
		expect(mockReplace).not.toHaveBeenCalled();
	});
});
