import { act, render } from "@testing-library/react-native";
import { type FunctionReference, getFunctionName } from "convex/server";
import { useIncomeActions } from "@/shared/hooks/use-income-actions";
import { TODAY_BALANCE_RECORD } from "@/shared/lib/income/draft";
import { limaStartOfDay } from "@/shared/lib/lima-date";

function isFunctionReference(
	value: unknown,
): value is FunctionReference<"query" | "mutation" | "action"> {
	return typeof value === "object" && value !== null;
}

const mockUseMutation = jest.fn();

jest.mock("convex/react", () => ({
	useMutation: (...args: unknown[]) => mockUseMutation(...args),
}));

const createMock = jest.fn();

function installMutationMocks() {
	mockUseMutation.mockImplementation((mutation: unknown) => {
		if (!isFunctionReference(mutation)) throw new Error("useMutation inesperado");
		if (getFunctionName(mutation) === "incomeEvents:createIncomeEvent") return createMock;
		throw new Error("useMutation inesperado");
	});
}

let actions: ReturnType<typeof useIncomeActions> | null = null;

function Host() {
	actions = useIncomeActions();
	return null;
}

const NOW = Date.parse("2026-10-10T02:30:00.000Z");

describe("useIncomeActions", () => {
	beforeEach(async () => {
		jest.clearAllMocks();
		installMutationMocks();
		createMock.mockResolvedValue({ isNewCycle: true });
		actions = null;
		await render(<Host />);
	});

	it("llama a createIncomeEvent sin allocation", async () => {
		const occurredAt = limaStartOfDay(NOW);
		await act(async () => {
			await actions?.register({ amountCents: 350000, occurredAt });
		});
		expect(createMock).toHaveBeenCalledTimes(1);
		expect(createMock).toHaveBeenCalledWith({
			amount: 350000,
			source: "payroll",
			description: "Sueldo",
			occurredAt,
			incomeKind: "habitual",
		});
		expect(createMock.mock.calls[0]?.[0]).not.toHaveProperty("allocation");
	});

	it("el saldo de hoy se envía como other y «Dinero de hoy», no como sueldo", async () => {
		const occurredAt = limaStartOfDay(NOW);
		await act(async () => {
			await actions?.register({ amountCents: 350000, occurredAt }, TODAY_BALANCE_RECORD);
		});
		expect(createMock).toHaveBeenCalledWith({
			amount: 350000,
			source: "other",
			description: "Dinero de hoy",
			occurredAt,
			incomeKind: "habitual",
		});
	});
});
