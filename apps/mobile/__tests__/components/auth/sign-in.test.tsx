import { cleanup, fireEvent, render, waitFor } from "@testing-library/react-native";
import SignInScreen from "@/app/(auth)/sign-in";

const mockPush = jest.fn();
const mockReplace = jest.fn();
const mockPasskey = jest.fn();
const mockEmail = jest.fn();
const mockSendOtp = jest.fn();
const mockGetNetworkStateAsync = jest.fn();

jest.mock("@/shared/components/app-shell", () => {
	const { View } = require("react-native");
	return {
		__esModule: true,
		default: ({ children }: { children?: unknown }) => <View>{children}</View>,
	};
});

jest.mock("expo-router", () => ({
	Redirect: () => null,
	useRouter: () => ({ push: mockPush, replace: mockReplace, back: jest.fn() }),
}));

jest.mock(
	"@quipu/convex-api",
	() => ({
		api: { profiles: { getMyProfile: "getMyProfile" } },
	}),
	{ virtual: true },
);

jest.mock("convex/react", () => ({
	useQuery: () => undefined,
}));

jest.mock("@/shared/components/ui/reicon", () => ({
	ChevronLeft: () => null,
	Check: () => null,
}));

jest.mock("@/lib/auth-client", () => ({
	authClient: {
		useSession: () => ({ data: null, isPending: false }),
		signIn: {
			passkey: (...args: unknown[]) => mockPasskey(...args),
			email: (...args: unknown[]) => mockEmail(...args),
		},
		emailOtp: {
			sendVerificationOtp: (...args: unknown[]) => mockSendOtp(...args),
			verifyEmail: jest.fn(),
		},
	},
}));

jest.mock("expo-network", () => ({
	getNetworkStateAsync: (...args: unknown[]) => mockGetNetworkStateAsync(...args),
	useNetworkState: () => ({ isConnected: true, isInternetReachable: true }),
}));

describe("SignInScreen", () => {
	beforeEach(() => {
		jest.clearAllMocks();
		mockGetNetworkStateAsync.mockResolvedValue({
			isConnected: true,
			isInternetReachable: true,
		});
	});

	afterEach(() => {
		cleanup();
	});

	it("al cancelar la passkey muestra el respaldo", async () => {
		mockPasskey.mockResolvedValue({
			data: null,
			error: { code: "ERROR_CEREMONY_ABORTED", message: "Auth cancelled" },
		});
		const view = await render(<SignInScreen />);

		await fireEvent.press(view.getByText("Continuar con Passkey"));

		expect(await view.findByText("Entra con tu correo.")).toBeTruthy();
		expect(
			view.getByText("Cancelaste la verificación. Puedes reintentar o usar tu respaldo."),
		).toBeTruthy();
		expect(view.getByLabelText("Correo")).toBeTruthy();
		expect(view.getByLabelText("Contraseña")).toBeTruthy();
	});

	it("EMAIL_NOT_VERIFIED envía el OTP y abre la verificación", async () => {
		mockEmail.mockResolvedValue({
			data: null,
			error: { code: "EMAIL_NOT_VERIFIED", message: "Email not verified" },
		});
		mockSendOtp.mockResolvedValue({ data: { success: true }, error: null });
		const view = await render(<SignInScreen />);

		await fireEvent.press(view.getByText("Entrar con correo"));
		await fireEvent.changeText(view.getByLabelText("Correo"), "ana@quipu.test");
		await fireEvent.changeText(view.getByLabelText("Contraseña"), "secreta-123");
		await fireEvent.press(view.getByText("Entrar"));

		await waitFor(() => {
			expect(mockSendOtp).toHaveBeenCalledWith({
				email: "ana@quipu.test",
				type: "email-verification",
			});
		});
		expect(view.getByText("Confirma tu correo.")).toBeTruthy();
		expect(view.getByLabelText("Código de verificación de 6 dígitos")).toBeTruthy();
	});

	it("un login fallido no revela si el correo existe", async () => {
		mockEmail.mockResolvedValue({
			data: null,
			error: { code: "USER_NOT_FOUND", message: "User not found" },
		});
		const view = await render(<SignInScreen />);

		await fireEvent.press(view.getByText("Entrar con correo"));
		await fireEvent.changeText(view.getByLabelText("Correo"), "ana@quipu.test");
		await fireEvent.changeText(view.getByLabelText("Contraseña"), "mala");
		await fireEvent.press(view.getByText("Entrar"));

		expect(await view.findByText("Email o contraseña incorrectos")).toBeTruthy();
		expect(view.queryByText(/User not found/)).toBeNull();
		expect(view.queryByText(/no existe/i)).toBeNull();
	});

	it("sin red muestra el mismo mensaje de credenciales y no deja el loader", async () => {
		mockGetNetworkStateAsync.mockResolvedValue({ isConnected: false });
		mockEmail.mockImplementation(() => new Promise(() => undefined));
		const view = await render(<SignInScreen />);

		await fireEvent.press(view.getByText("Entrar con correo"));
		await fireEvent.changeText(view.getByLabelText("Correo"), "ana@quipu.test");
		await fireEvent.changeText(view.getByLabelText("Contraseña"), "secreta-123");
		await fireEvent.press(view.getByText("Entrar"));

		expect(await view.findByText("Email o contraseña incorrectos")).toBeTruthy();
		expect(mockEmail).not.toHaveBeenCalled();
		expect(view.getByText("Entrar")).toBeTruthy();
	});

	it("si signIn lanza, muestra el mensaje de credenciales", async () => {
		mockEmail.mockRejectedValue(new TypeError("Network request failed"));
		const view = await render(<SignInScreen />);

		await fireEvent.press(view.getByText("Entrar con correo"));
		await fireEvent.changeText(view.getByLabelText("Correo"), "ana@quipu.test");
		await fireEvent.changeText(view.getByLabelText("Contraseña"), "secreta-123");
		await fireEvent.press(view.getByText("Entrar"));

		expect(await view.findByText("Email o contraseña incorrectos")).toBeTruthy();
		expect(view.getByText("Entrar")).toBeTruthy();
	});

	it("Olvidé la mía abre recuperar con el correo escrito", async () => {
		const view = await render(<SignInScreen />);
		await fireEvent.press(view.getByText("Entrar con correo"));
		await fireEvent.changeText(view.getByLabelText("Correo"), "ana@quipu.test");
		await fireEvent.press(view.getByText("Olvidé la mía"));
		expect(mockPush).toHaveBeenCalledWith("/recuperar?email=ana%40quipu.test");
	});
});
