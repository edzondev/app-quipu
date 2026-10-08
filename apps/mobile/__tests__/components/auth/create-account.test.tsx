import { cleanup, fireEvent, render, waitFor } from "@testing-library/react-native";
import CreateAccountScreen from "@/app/(auth)/create-account";

const mockPush = jest.fn();
const mockSignUp = jest.fn();
const mockSendOtp = jest.fn();
const mockVerify = jest.fn();
const mockSignIn = jest.fn();

jest.mock("@/shared/components/app-shell", () => {
	const { View } = require("react-native");
	return {
		__esModule: true,
		default: ({ children }: { children?: unknown }) => <View>{children}</View>,
	};
});

jest.mock("expo-router", () => ({
	useRouter: () => ({ push: mockPush, replace: jest.fn(), back: jest.fn() }),
}));

jest.mock("@/shared/components/ui/reicon", () => ({
	ChevronLeft: () => null,
	Check: () => null,
}));

jest.mock("@/lib/auth-client", () => ({
	authClient: {
		signUp: { email: (...args: unknown[]) => mockSignUp(...args) },
		signIn: { email: (...args: unknown[]) => mockSignIn(...args) },
		emailOtp: {
			sendVerificationOtp: (...args: unknown[]) => mockSendOtp(...args),
			verifyEmail: (...args: unknown[]) => mockVerify(...args),
		},
		passkey: { addPasskey: jest.fn() },
	},
}));

async function fillAccount(view: Awaited<ReturnType<typeof render>>) {
	await fireEvent.changeText(view.getByLabelText("Nombre"), "Ana");
	await fireEvent.changeText(view.getByLabelText("Correo"), "ana@quipu.test");
	await fireEvent.changeText(view.getByLabelText("Contraseña"), "secreta-123");
	await fireEvent.press(view.getByText("Continuar"));
}

describe("CreateAccountScreen", () => {
	beforeEach(() => {
		jest.clearAllMocks();
		mockSendOtp.mockResolvedValue({ error: null });
		mockSignIn.mockResolvedValue({ error: null });
	});

	afterEach(() => {
		cleanup();
	});

	it("envía el OTP al completar los 6 dígitos", async () => {
		mockSignUp.mockResolvedValue({ error: null });
		mockVerify.mockResolvedValue({ error: null });
		const view = await render(<CreateAccountScreen />);
		await fillAccount(view);

		const code = await view.findByLabelText("Código de verificación de 6 dígitos");
		await fireEvent.changeText(code, "12345");
		expect(mockVerify).not.toHaveBeenCalled();

		await fireEvent.changeText(code, "123456");
		await waitFor(() => {
			expect(mockVerify).toHaveBeenCalledWith({
				email: "ana@quipu.test",
				otp: "123456",
			});
		});
	});

	it("un código incorrecto avisa sin inventar intentos", async () => {
		mockSignUp.mockResolvedValue({ error: null });
		mockVerify.mockResolvedValue({
			error: { code: "INVALID_OTP", message: "Invalid OTP" },
		});
		const view = await render(<CreateAccountScreen />);
		await fillAccount(view);

		const code = await view.findByLabelText("Código de verificación de 6 dígitos");
		await fireEvent.changeText(code, "000000");

		expect(await view.findByText("El código no coincide.")).toBeTruthy();
		expect(view.queryByText(/intentos/)).toBeNull();
	});

	it("si la cuenta ya existe ofrece Entrar y no sigue al código", async () => {
		mockSignUp.mockResolvedValue({
			error: { code: "USER_ALREADY_EXISTS", message: "User already exists. Use another email." },
		});
		const view = await render(<CreateAccountScreen />);
		await fillAccount(view);

		expect(await view.findByText("Ya existe una cuenta con este correo")).toBeTruthy();
		expect(view.queryByText("Confirma tu correo.")).toBeNull();
		await fireEvent.press(view.getByText("Entrar"));
		expect(mockPush).toHaveBeenCalledWith("/sign-in");
		expect(mockSendOtp).not.toHaveBeenCalled();
	});
});
