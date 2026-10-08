import { cleanup, fireEvent, render, waitFor } from "@testing-library/react-native";
import SignInScreen from "@/app/(auth)/sign-in";

const mockPush = jest.fn();
const mockReplace = jest.fn();
const mockPasskey = jest.fn();
const mockEmail = jest.fn();
const mockSendOtp = jest.fn();

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

describe("SignInScreen", () => {
	beforeEach(() => {
		jest.clearAllMocks();
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

		expect(await view.findByText("Entra con tu respaldo.")).toBeTruthy();
		expect(
			view.getByText("Cancelaste Face ID. Puedes reintentar o usar tu respaldo."),
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

	it("Olvidé la mía abre recuperar", async () => {
		const view = await render(<SignInScreen />);
		await fireEvent.press(view.getByText("Entrar con correo"));
		await fireEvent.press(view.getByText("Olvidé la mía"));
		expect(mockPush).toHaveBeenCalledWith("/recuperar");
	});
});
