import { cleanup, fireEvent, render, waitFor } from "@testing-library/react-native";
import { getFunctionName } from "convex/server";
import type { PendingNotification } from "@/modules/quipu-notification-listener";
import { DetectedExpenseSheet } from "@/shared/components/expenses/detected-expense-sheet";

const mockUseMutation = jest.fn();
const registerMock = jest.fn();
const mockConsume = jest.fn();

jest.mock("convex/react", () => ({
	useMutation: (...args: unknown[]) => mockUseMutation(...args),
}));

jest.mock("@/modules/quipu-notification-listener", () => ({
	consumeNotification: (id: string) => mockConsume(id),
}));

const FROZEN =
	"Este sobre está congelado temporalmente. Espera a que termine el congelamiento o elige otro sobre.";

const item: PendingNotification = {
	id: "k|1",
	packageName: "com.bcp.innovacxion.yapeapp",
	postedAt: 1,
	title: "Yape",
	text: "Pago S/ 42.00",
	amountCents: 4200,
};

function installMutationMocks() {
	mockUseMutation.mockImplementation((mutation: Parameters<typeof getFunctionName>[0]) => {
		const name = getFunctionName(mutation);
		if (name === "expenses:registerExpense") return registerMock;
		return jest.fn();
	});
}

async function renderSheet(onClose = jest.fn(), bankName = "Yape") {
	const view = await render(
		<DetectedExpenseSheet item={item} bankName={bankName} onClose={onClose} />,
	);
	return { view, onClose };
}

describe("DetectedExpenseSheet", () => {
	beforeEach(() => {
		jest.clearAllMocks();
		installMutationMocks();
		registerMock.mockResolvedValue({ expenseId: "e1" });
		mockConsume.mockResolvedValue(true);
	});

	afterEach(() => {
		cleanup();
	});

	it("Guardar calls registerExpense with the queue id then consumes", async () => {
		const order: string[] = [];
		registerMock.mockImplementation(async () => {
			order.push("register");
			return { expenseId: "e1" };
		});
		mockConsume.mockImplementation(async () => {
			order.push("consume");
			return true;
		});
		const { view, onClose } = await renderSheet();

		expect(view.getByLabelText("Monto").props.value).toBe("42");
		expect(view.getByLabelText("Descripción").props.value).toBe("Yape");
		await fireEvent.press(view.getByText("Necesidades"));
		await fireEvent.press(view.getByRole("button", { name: "Guardar" }));

		await waitFor(() => expect(onClose).toHaveBeenCalledTimes(1));
		expect(registerMock).toHaveBeenCalledWith({
			amount: 4200,
			description: "Yape",
			envelopeType: "needs",
			idempotencyKey: "k|1",
		});
		expect(mockConsume).toHaveBeenCalledWith("k|1");
		expect(order).toEqual(["register", "consume"]);
	});

	it("keeps the item and shows the server message when registerExpense fails", async () => {
		registerMock.mockRejectedValue({
			data: { code: "ENVELOPE_FROZEN", message: FROZEN },
		});
		const { view, onClose } = await renderSheet();

		await fireEvent.press(view.getByText("Gustos"));
		await fireEvent.press(view.getByRole("button", { name: "Guardar" }));

		expect(await view.findByText(FROZEN)).toBeTruthy();
		expect(mockConsume).not.toHaveBeenCalled();
		expect(onClose).not.toHaveBeenCalled();
	});

	it("Descartar only consumes the queue item", async () => {
		const { view, onClose } = await renderSheet();

		await fireEvent.press(view.getByRole("button", { name: "Descartar" }));

		await waitFor(() => expect(onClose).toHaveBeenCalledTimes(1));
		expect(mockConsume).toHaveBeenCalledWith("k|1");
		expect(registerMock).not.toHaveBeenCalled();
	});
});
