import { cleanup, fireEvent, render, waitFor } from "@testing-library/react-native";
import RecuperarScreen from "@/app/(auth)/recuperar";

const mockReset = jest.fn();

jest.mock("@/shared/components/app-shell", () => {
	const { View } = require("react-native");
	return {
		__esModule: true,
		default: ({ children }: { children?: unknown }) => <View>{children}</View>,
	};
});

jest.mock("expo-router", () => ({
	useRouter: () => ({ back: jest.fn(), push: jest.fn(), replace: jest.fn() }),
	useLocalSearchParams: () => ({ email: "ana@quipu.test" }),
}));

jest.mock("@/shared/components/ui/reicon", () => ({
	ChevronLeft: () => null,
	Check: () => null,
}));

jest.mock("@/lib/auth-client", () => ({
	authClient: {
		requestPasswordReset: (...args: unknown[]) => mockReset(...args),
	},
}));

const SENT_COPY = /Vence en 1 hora/;

describe("RecuperarScreen", () => {
	beforeEach(() => {
		jest.clearAllMocks();
		process.env.EXPO_PUBLIC_SITE_URL = "https://quipu.test";
	});

	afterEach(() => {
		cleanup();
	});

	async function submit(email: string) {
		const view = await render(<RecuperarScreen />);
		await fireEvent.changeText(view.getByLabelText("Correo"), email);
		await fireEvent.press(view.getByText("Enviar enlace"));
		return view;
	}

	it("pide el enlace con URL absoluta y muestra revisa tu correo", async () => {
		mockReset.mockResolvedValue({ data: { status: true }, error: null });
		const view = await submit("ana@quipu.test");

		await waitFor(() => {
			expect(mockReset).toHaveBeenCalledWith({
				email: "ana@quipu.test",
				redirectTo: "https://quipu.test/restablecer-contrasena",
			});
		});
		const redirectTo = mockReset.mock.calls[0]?.[0]?.redirectTo as string;
		expect(new URL(redirectTo).protocol).toBe("https:");
		expect(view.getByText("Revisa tu correo.")).toBeTruthy();
		expect(view.getByText(SENT_COPY)).toBeTruthy();
		expect(view.getByText("01")).toBeTruthy();
		expect(view.getByText("02")).toBeTruthy();
		expect(view.getByText("03")).toBeTruthy();
		expect(view.queryByText("Abrir mi app de correo")).toBeNull();
	});

	it("muestra el mismo mensaje si la cuenta no existe", async () => {
		mockReset.mockResolvedValue({
			data: null,
			error: { code: "USER_NOT_FOUND", message: "User not found" },
		});
		const view = await submit("nadie@quipu.test");

		expect(await view.findByText("Revisa tu correo.")).toBeTruthy();
		expect(view.getByText(SENT_COPY)).toBeTruthy();
		expect(view.queryByText(/User not found/)).toBeNull();
		expect(view.queryByText(/no existe/i)).toBeNull();
	});
});
