import { cleanup, fireEvent, render } from "@testing-library/react-native";
import { getFunctionName } from "convex/server";
import { closedCycleSurplus } from "@/__fixtures__/closed-cycle-surplus";
import { ClosedCycleSurplusCard } from "@/shared/components/progress/closed-cycle-surplus-card";

const mockUseQuery = jest.fn();
const mockUseMutation = jest.fn();
const moveMock = jest.fn();

jest.mock("convex/react", () => ({
	useQuery: (...args: unknown[]) => mockUseQuery(...args),
	useMutation: (...args: unknown[]) => mockUseMutation(...args),
}));

jest.mock("@/shared/hooks/use-profile-gate", () => ({
	useProfileGate: () => ({ isAuthReady: true, isLoading: false, profile: null }),
}));

describe("ClosedCycleSurplusCard", () => {
	beforeEach(() => {
		jest.clearAllMocks();
		moveMock.mockResolvedValue(null);
		mockUseMutation.mockReturnValue(moveMock);
	});

	afterEach(() => {
		cleanup();
	});

	it("no renderiza mientras la query carga", async () => {
		mockUseQuery.mockReturnValue(undefined);
		const view = await render(<ClosedCycleSurplusCard />);
		expect(view.queryByLabelText("Mover al Fondo")).toBeNull();
	});

	it("no renderiza si no hay ciclo cerrado", async () => {
		mockUseQuery.mockReturnValue(null);
		const view = await render(<ClosedCycleSurplusCard />);
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
		expect(view.queryByLabelText("Mover al Fondo")).toBeNull();
	});

	it("muestra el estado movido sin botón cuando el sobrante ya se movió", async () => {
		mockUseQuery.mockReturnValue({ ...closedCycleSurplus, movedAt: 1_700_000_000_000 });
		const view = await render(<ClosedCycleSurplusCard />);
		expect(view.getByText("Movido al Fondo")).toBeTruthy();
		expect(view.getByText("S/ 210")).toBeTruthy();
		expect(view.getByText("Necesidades")).toBeTruthy();
		expect(view.queryByLabelText("Mover al Fondo")).toBeNull();
		expect(view.queryByText("Mover al Fondo")).toBeNull();
	});

	it("muestra el total y el desglose", async () => {
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
	});

	it("mueve el sobrante al Fondo con el ciclo cerrado", async () => {
		mockUseQuery.mockReturnValue(closedCycleSurplus);
		const view = await render(<ClosedCycleSurplusCard />);

		expect(getFunctionName(mockUseMutation.mock.calls[0]?.[0])).toBe(
			"savings:moveClosedCycleSurplusToFund",
		);
		await fireEvent.press(view.getByLabelText("Mover al Fondo"));
		expect(moveMock).toHaveBeenCalledWith({ closedCycleId: closedCycleSurplus.closedCycleId });
	});
});
