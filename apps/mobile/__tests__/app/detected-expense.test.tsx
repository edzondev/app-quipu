import { cleanup, fireEvent, render, waitFor } from "@testing-library/react-native";
import { BackHandler } from "react-native";
import DetectedExpenseScreen from "@/app/detected-expense";

const mockBack = jest.fn();
const mockReplace = jest.fn();
const mockCanGoBack = jest.fn(() => true);
const mockRegister = jest.fn(async (_input: unknown, _key?: string) => ({ expenseId: "exp_1" }));

const AT = Date.parse("2026-10-24T00:12:00.000Z");
const params: { current: Record<string, string> } = { current: {} };
const mockSessionGate = { isAuthReady: true, isLoading: false };

jest.mock("expo-router", () => ({
	Redirect: ({ href }: { href: string }) => {
		const { Text } = require("react-native");
		return <Text>{`redirect:${href}`}</Text>;
	},
	useRouter: () => ({
		back: mockBack,
		replace: mockReplace,
		canGoBack: () => mockCanGoBack(),
	}),
	useLocalSearchParams: () => params.current,
}));

jest.mock("@/shared/hooks/use-profile-gate", () => ({
	useProfileGate: () => mockSessionGate,
}));

jest.mock("@/shared/hooks/use-expense-actions", () => ({
	useExpenseActions: () => ({
		register: (input: unknown, idempotencyKey?: string) => mockRegister(input, idempotencyKey),
	}),
}));

function pressHardwareBack() {
	const registration = jest.mocked(BackHandler.addEventListener).mock.calls.at(-1);
	const handler = registration?.[1];
	if (!handler) throw new Error("no hardware back handler");
	return handler({ type: "hardwareBackPress", timeStamp: 0 });
}

describe("gasto detectado", () => {
	beforeEach(() => {
		jest.clearAllMocks();
		mockCanGoBack.mockReturnValue(true);
		mockSessionGate.isAuthReady = true;
		mockSessionGate.isLoading = false;
		params.current = {
			id: "n|1",
			cents: "4590",
			merchant: "Tambo+",
			bank: "Interbank",
			at: String(AT),
		};
		jest.spyOn(BackHandler, "addEventListener").mockImplementation(() => ({ remove: jest.fn() }));
	});

	afterEach(() => {
		cleanup();
		jest.restoreAllMocks();
	});

	it("el toque precarga monto, comercio, banco y hora", async () => {
		const view = await render(<DetectedExpenseScreen />);
		expect(view.getByLabelText("Monto").props.children).toBe("45.90");
		expect(view.getByLabelText("Comercio").props.value).toBe("Tambo+");
		expect(view.getByText("Interbank · 19:12")).toBeTruthy();
	});

	it("sin monto abre el teclado en cero", async () => {
		params.current = { id: "n|2", bank: "Interbank", at: String(AT) };
		const view = await render(<DetectedExpenseScreen />);
		expect(view.getByLabelText("Monto").props.children).toBe("0.00");
	});

	it("sin sesión manda a entrar y no abre la hoja", async () => {
		mockSessionGate.isAuthReady = false;
		mockSessionGate.isLoading = false;
		const view = await render(<DetectedExpenseScreen />);
		expect(view.getByText("redirect:/(auth)/sign-in")).toBeTruthy();
		expect(view.queryByLabelText("Monto")).toBeNull();
		expect(mockRegister).not.toHaveBeenCalled();
	});

	it("sin id avisa que no encontramos el gasto", async () => {
		params.current = {};
		const view = await render(<DetectedExpenseScreen />);
		expect(view.getByText("No encontramos este gasto.")).toBeTruthy();
		expect(mockRegister).not.toHaveBeenCalled();
	});

	it("guardar usa el id del aviso como clave", async () => {
		const view = await render(<DetectedExpenseScreen />);
		await fireEvent.press(view.getByText("Gustos"));
		await fireEvent.press(view.getByText("Registrar gasto"));
		await waitFor(() => {
			expect(mockRegister).toHaveBeenCalledWith(
				{ amountRaw: "45.90", description: "Tambo+", envelopeType: "wants" },
				"n|1",
			);
		});
		expect(mockBack).toHaveBeenCalled();
	});

	it("cancelar no guarda", async () => {
		const view = await render(<DetectedExpenseScreen />);
		await fireEvent.press(view.getByLabelText("Cancelar"));
		expect(mockRegister).not.toHaveBeenCalled();
		expect(mockBack).toHaveBeenCalled();
	});

	it("atrás del sistema no guarda", async () => {
		await render(<DetectedExpenseScreen />);
		pressHardwareBack();
		expect(mockRegister).not.toHaveBeenCalled();
		expect(mockBack).toHaveBeenCalled();
	});
});
