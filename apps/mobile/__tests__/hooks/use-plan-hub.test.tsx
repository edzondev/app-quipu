import { render } from "@testing-library/react-native";
import { getFunctionName } from "convex/server";
import { Text } from "react-native";
import { summaryWithCycle } from "@/__fixtures__/dashboard-summary";
import { savingsOverview } from "@/__fixtures__/savings-overview";
import { PlanHub } from "@/shared/components/plan/plan-hub";
import { useAhorroPlanRow } from "@/shared/hooks/use-ahorro";
import { usePlanHub } from "@/shared/hooks/use-plan-hub";

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

jest.mock("@/shared/components/ui/reicon", () => ({
	ChevronRight: () => null,
}));

let overview: unknown;

function queryName(query: unknown): string {
	return getFunctionName(query as Parameters<typeof getFunctionName>[0]);
}

function RowProbe() {
	const row = useAhorroPlanRow();
	return <Text>{row === undefined ? "cargando" : row === null ? "vacio" : "listo"}</Text>;
}

function HubProbe() {
	const hub = usePlanHub();
	return (
		<PlanHub
			status={hub.status}
			model={hub.model}
			ahorro={hub.ahorro}
			onOpenSobres={() => undefined}
			onOpenCommitments={() => undefined}
			onOpenAhorro={() => undefined}
		/>
	);
}

describe("usePlanHub mientras Ahorro carga", () => {
	beforeEach(() => {
		overview = undefined;
		mockUseSession.mockReturnValue({ isPending: false });
		mockUseConvexAuth.mockReturnValue({ isAuthenticated: true, isLoading: false });
		mockUseQuery.mockImplementation((query: unknown, args: unknown) => {
			if (args === "skip") return undefined;
			const name = queryName(query);
			if (name === "savings:getOverview") return overview;
			if (name === "dashboard:getSummary") return summaryWithCycle();
			return { name: "Edzon" };
		});
	});

	it("undefined es cargando y null es vacío", async () => {
		const loading = await render(<RowProbe />);
		expect(loading.getByText("cargando")).toBeTruthy();
		await loading.unmount();

		overview = null;
		const empty = await render(<RowProbe />);
		expect(empty.getByText("vacio")).toBeTruthy();
	});

	it("no pinta la fila de Ahorro mientras getOverview sigue en undefined", async () => {
		const view = await render(<HubProbe />);
		expect(view.getByText("Cargando…")).toBeTruthy();
		expect(view.queryByText("Ahorro y metas")).toBeNull();
		expect(view.queryByText("Ahorro planeado")).toBeNull();
		expect(view.queryByText("Ahorro")).toBeNull();
		expect(view.queryByText("Sobres")).toBeNull();
	});

	it("no consulta getSettingsOverview y sigue cargando si el resumen no llegó", async () => {
		overview = savingsOverview;
		const ready = await render(<HubProbe />);
		expect(ready.getByText("Sobres")).toBeTruthy();
		const names = mockUseQuery.mock.calls.map((call) => queryName(call[0]));
		expect(names).toContain("dashboard:getSummary");
		expect(names).not.toContain("settings:getSettingsOverview");
		await ready.unmount();

		mockUseQuery.mockImplementation((query: unknown, args: unknown) => {
			if (args === "skip") return undefined;
			const name = queryName(query);
			if (name === "savings:getOverview") return savingsOverview;
			if (name === "dashboard:getSummary") return undefined;
			return { name: "Edzon" };
		});
		const loading = await render(<HubProbe />);
		expect(loading.getByText("Cargando…")).toBeTruthy();
		expect(loading.queryByText("Sobres")).toBeNull();
	});
});
