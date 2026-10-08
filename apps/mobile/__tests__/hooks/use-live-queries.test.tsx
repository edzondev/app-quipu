import { render } from "@testing-library/react-native";
import { getFunctionName } from "convex/server";
import { useAhorro } from "@/shared/hooks/use-ahorro";
import { useDashboardSummary } from "@/shared/hooks/use-dashboard";
import { useRecentExpenses } from "@/shared/hooks/use-expenses";
import { useMovements } from "@/shared/hooks/use-movements";

const mockUseQuery = jest.fn();
const mockUseConvexAuth = jest.fn();
const mockUseSession = jest.fn();

jest.mock("convex/react", () => ({
	useQuery: (...args: unknown[]) => mockUseQuery(...args),
	useConvexAuth: () => mockUseConvexAuth(),
}));

jest.mock("@/lib/auth-client", () => ({
	authClient: {
		useSession: () => mockUseSession(),
	},
}));

function Host() {
	useDashboardSummary();
	useMovements();
	useAhorro();
	useRecentExpenses();
	return null;
}

function queryName(query: unknown): string {
	return getFunctionName(query as Parameters<typeof getFunctionName>[0]);
}

describe("consultas en vivo", () => {
	beforeEach(() => {
		jest.clearAllMocks();
		mockUseSession.mockReturnValue({ isPending: false });
		mockUseQuery.mockReturnValue(undefined);
	});

	it("no consulta Convex hasta que la sesión está autenticada", async () => {
		mockUseConvexAuth.mockReturnValue({
			isAuthenticated: false,
			isLoading: false,
		});
		await render(<Host />);
		const live = mockUseQuery.mock.calls.filter(
			(call) => call[1] !== "skip" && queryName(call[0]) !== "profiles:getMyProfile",
		);
		expect(live).toHaveLength(0);
	});

	it("pide dashboard, movimientos, ahorro y gastos recientes con args vacíos", async () => {
		mockUseConvexAuth.mockReturnValue({
			isAuthenticated: true,
			isLoading: false,
		});
		await render(<Host />);
		const names = [
			...new Set(
				mockUseQuery.mock.calls
					.filter((call) => call[1] !== "skip")
					.map((call) => queryName(call[0])),
			),
		].sort();
		expect(names).toEqual(
			[
				"dashboard:getSummary",
				"expenses:getRecentExpenses",
				"movements:listForActiveCycle",
				"profiles:getMyProfile",
				"savings:getMoveSurplusContext",
				"savings:getOverview",
			].sort(),
		);
		for (const call of mockUseQuery.mock.calls) {
			if (call[1] !== "skip") expect(call[1]).toEqual({});
		}
	});
});
