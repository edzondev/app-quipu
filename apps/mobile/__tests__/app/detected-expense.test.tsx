import { cleanup, fireEvent, render, waitFor } from "@testing-library/react-native";
import { BackHandler } from "react-native";
import DetectedExpenseScreen from "@/app/detected-expense";

const mockBack = jest.fn();
const mockReplace = jest.fn();
const mockCanGoBack = jest.fn(() => true);
const mockRegister = jest.fn(async (_input: unknown, _key?: string) => ({ expenseId: "exp_1" }));
const mockDismiss = jest.fn();

const AT = Date.parse("2026-10-24T00:12:00.000Z");
const params: { current: Record<string, string> } = { current: {} };

jest.mock("expo-router", () => ({
	useRouter: () => ({
		back: mockBack,
		replace: mockReplace,
		canGoBack: () => mockCanGoBack(),
	}),
	useLocalSearchParams: () => params.current,
}));

jest.mock("@/modules/quipu-notification-listener", () => ({
	dismissNotice: (id: string) => mockDismiss(id),
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
		await view.unmount();
		params.current = { id: "n|2", bank: "Interbank", at: String(AT) };
		const empty = await render(<DetectedExpenseScreen />);
		expect(empty.getByLabelText("Monto").props.children).toBe("0.00");
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
		expect(mockDismiss).toHaveBeenCalledWith("n|1");
		expect(mockBack).toHaveBeenCalled();
	});

	it("cerrar no guarda y borra el aviso", async () => {
		const view = await render(<DetectedExpenseScreen />);
		await fireEvent.press(view.getByLabelText("Cancelar"));
		pressHardwareBack();
		expect(mockRegister).not.toHaveBeenCalled();
		expect(mockDismiss).toHaveBeenCalledWith("n|1");
		expect(mockBack).toHaveBeenCalled();
	});
});
