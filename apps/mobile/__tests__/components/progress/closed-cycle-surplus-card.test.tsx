import { cleanup, render } from "@testing-library/react-native";
import { closedCycleSurplus } from "@/__fixtures__/closed-cycle-surplus";
import { closeReport } from "@/__fixtures__/progress";
import { savingsOverview } from "@/__fixtures__/savings-overview";
import { CloseScreen } from "@/shared/components/progress/close-screen";
import { ClosedCycleSurplusCard } from "@/shared/components/progress/closed-cycle-surplus-card";
import { presentClose } from "@/shared/lib/progress/model";

const mockUseQuery = jest.fn();

jest.mock("convex/react", () => ({
	useQuery: (...args: unknown[]) => mockUseQuery(...args),
}));

jest.mock("@/shared/hooks/use-profile-gate", () => ({
	useProfileGate: () => ({ isAuthReady: true, isLoading: false, profile: null }),
}));

describe("ClosedCycleSurplusCard", () => {
	beforeEach(() => {
		jest.clearAllMocks();
	});

	afterEach(() => {
		cleanup();
	});

	it("no renderiza mientras la query carga", async () => {
		mockUseQuery.mockReturnValue(undefined);
		const view = await render(<ClosedCycleSurplusCard />);
		expect(view.queryByText("Mover al Fondo")).toBeNull();
		expect(view.queryByLabelText("Mover al Fondo")).toBeNull();
	});

	it("no renderiza si no hay ciclo cerrado", async () => {
		mockUseQuery.mockReturnValue(null);
		const view = await render(<ClosedCycleSurplusCard />);
		expect(view.queryByText("Mover al Fondo")).toBeNull();
		expect(view.queryByLabelText("Mover al Fondo")).toBeNull();
	});

	it("no renderiza si el total es 0", async () => {
		mockUseQuery.mockReturnValue({
			...closedCycleSurplus,
			needs: 0,
			wants: 0,
			extraordinary: 0,
			total: 0,
		});
		const view = await render(<ClosedCycleSurplusCard />);
		expect(view.queryByText("Necesidades")).toBeNull();
		expect(view.queryByText("Mover al Fondo")).toBeNull();
		expect(view.queryByLabelText("Mover al Fondo")).toBeNull();
	});

	it("muestra el desglose sin ofrecer moverlo al Fondo", async () => {
		mockUseQuery.mockReturnValue(closedCycleSurplus);
		const view = await render(<ClosedCycleSurplusCard />);

		expect(view.getByText("S/ 210")).toBeTruthy();
		expect(view.getByText("Necesidades")).toBeTruthy();
		expect(view.getByText("S/ 100")).toBeTruthy();
		expect(view.getByText("Gustos")).toBeTruthy();
		expect(view.getByText("S/ 60")).toBeTruthy();
		expect(view.getByText("Ingresos extra")).toBeTruthy();
		expect(view.getByText("S/ 50")).toBeTruthy();
		expect(view.queryByText("cycle-1")).toBeNull();
		expect(view.queryByText("Mover al Fondo")).toBeNull();
		expect(view.queryByLabelText("Mover al Fondo")).toBeNull();
		expect(view.queryByText("Movido al Fondo")).toBeNull();
		expect(view.queryByText("Moviendo…")).toBeNull();
	});

	it("tampoco ofrece Mover al Fondo si el sobrante ya se había movido", async () => {
		mockUseQuery.mockReturnValue({ ...closedCycleSurplus, movedAt: 1_700_000_000_000 });
		const view = await render(<ClosedCycleSurplusCard />);
		expect(view.getByText("S/ 210")).toBeTruthy();
		expect(view.queryByText("Movido al Fondo")).toBeNull();
		expect(view.queryByText("Mover al Fondo")).toBeNull();
		expect(view.queryByLabelText("Mover al Fondo")).toBeNull();
	});

	it("en el cierre de Progreso no aparece Mover al Fondo", async () => {
		mockUseQuery.mockReturnValue(closedCycleSurplus);
		const view = await render(
			<CloseScreen
				status="ready"
				model={presentClose(closeReport, savingsOverview)}
				onBack={jest.fn()}
				footer={<ClosedCycleSurplusCard />}
			/>,
		);

		expect(view.getByText("Cerraste julio con S/ 210 de sobra.")).toBeTruthy();
		expect(view.getByText("SOBRANTE")).toBeTruthy();
		expect(view.queryByText("Mover al Fondo")).toBeNull();
		expect(view.queryByRole("button", { name: "Mover al Fondo" })).toBeNull();
		expect(view.queryByText("Movido al Fondo")).toBeNull();
	});
});
