import { act, render } from "@testing-library/react-native";
import { getFunctionName } from "convex/server";
import { useExpenseActions } from "@/shared/hooks/use-expense-actions";
import { ExpenseValidationError } from "@/shared/lib/expenses/draft";

const mockUseMutation = jest.fn();

jest.mock("convex/react", () => ({
	useMutation: (...args: unknown[]) => mockUseMutation(...args),
}));

const registerMock = jest.fn();
const updateMock = jest.fn();
const deleteMock = jest.fn();

function installMutationMocks() {
	mockUseMutation.mockImplementation((mutation: unknown) => {
		const name = getFunctionName(mutation as Parameters<typeof getFunctionName>[0]);
		if (name === "expenses:registerExpense") return registerMock;
		if (name === "expenses:updateExpense") return updateMock;
		if (name === "expenses:deleteExpense") return deleteMock;
		throw new Error(`useMutation inesperado: ${name}`);
	});
}

let actions: ReturnType<typeof useExpenseActions> | null = null;

function Host() {
	actions = useExpenseActions();
	return null;
}

describe("useExpenseActions", () => {
	beforeEach(async () => {
		jest.clearAllMocks();
		installMutationMocks();
		registerMock.mockResolvedValue({ expenseId: "e1" });
		updateMock.mockResolvedValue({ success: true });
		deleteMock.mockResolvedValue({ success: true });
		actions = null;
		await render(<Host />);
	});

	it("no llama a Convex si el borrador es ahorro", async () => {
		await expect(
			actions?.register({
				amountRaw: "10",
				description: "Fondo",
				envelopeType: "savings",
			}),
		).rejects.toBeInstanceOf(ExpenseValidationError);
		expect(registerMock).not.toHaveBeenCalled();
	});

	it("registra el gasto en céntimos con la descripción recortada", async () => {
		await act(async () => {
			await actions?.register({
				amountRaw: "10.5",
				description: "  café  ",
				envelopeType: "needs",
			});
		});
		expect(registerMock).toHaveBeenCalledWith({
			amount: 1050,
			description: "café",
			envelopeType: "needs",
		});
	});

	it("actualiza y elimina por id de gasto", async () => {
		await act(async () => {
			await actions?.update("exp1", {
				amountRaw: "4",
				description: "Bus",
				envelopeType: "wants",
			});
			await actions?.remove("exp1");
		});
		expect(updateMock).toHaveBeenCalledWith({
			expenseId: "exp1",
			amount: 400,
			description: "Bus",
			envelopeType: "wants",
		});
		expect(deleteMock).toHaveBeenCalledWith({ expenseId: "exp1" });
	});
});
