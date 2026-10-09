import { act, render } from "@testing-library/react-native";
import { type FunctionReference, getFunctionName } from "convex/server";
import { extraKind, sueldoKind } from "@/__fixtures__/income-kind";
import { useIncomeActions } from "@/shared/hooks/use-income-actions";
import { toCreateIncomeEventArgs } from "@/shared/lib/income/draft";
import { limaStartOfDay } from "@/shared/lib/lima-date";
import { assertCreateIncomeEventArgs } from "@/test-support/assert-create-income-event-args";

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
			await actions?.register({ amountCents: 350000, occurredAt, incomeKind: sueldoKind });
		});
		expect(createMock).toHaveBeenCalledTimes(1);
		const expected = toCreateIncomeEventArgs({
			amountCents: 350000,
			occurredAt,
			incomeKind: sueldoKind,
		});
		assertCreateIncomeEventArgs(expected);
		expect(createMock).toHaveBeenCalledWith(expected);
		assertCreateIncomeEventArgs(createMock.mock.calls[0]?.[0]);
		expect(createMock.mock.calls[0]?.[0]).not.toHaveProperty("allocation");
		expect(createMock.mock.calls[0]?.[0]).not.toHaveProperty("extraordinaryType");
	});

	it("reenvía incomeKind extraordinary cuando el ingreso es extra", async () => {
		const occurredAt = limaStartOfDay(NOW);
		await act(async () => {
			await actions?.register({ amountCents: 50000, occurredAt, incomeKind: extraKind });
		});
		const expected = toCreateIncomeEventArgs({
			amountCents: 50000,
			occurredAt,
			incomeKind: extraKind,
		});
		assertCreateIncomeEventArgs(expected);
		expect(expected).toMatchObject({
			incomeKind: "extraordinary",
			extraordinaryType: "custom",
			extraordinaryLabel: "Extra",
			distributionPolicy: "profile_default",
		});
		expect(createMock).toHaveBeenCalledWith(expected);
		assertCreateIncomeEventArgs(createMock.mock.calls[0]?.[0]);
	});
});
