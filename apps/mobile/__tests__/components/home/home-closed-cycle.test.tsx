import { act, cleanup, fireEvent, render } from "@testing-library/react-native";
import { getFunctionName } from "convex/server";
import type { ReactNode } from "react";
import { closedCycleSurplus } from "@/__fixtures__/closed-cycle-surplus";
import {
	closedCycleOnSummary,
	summaryAfterClose,
	summaryWithoutCycle,
} from "@/__fixtures__/dashboard-summary";
import HomePage from "@/app/(tabs)";
import { RegistrarProvider } from "@/shared/components/navigation/registrar-context";
import { limaDayLabel } from "@/shared/lib/lima-date";
import { formatCentsTrimmed } from "@/shared/lib/money";

const mockUseQuery = jest.fn();
const mockUseMutation = jest.fn();
const moveMock = jest.fn();

jest.mock("convex/react", () => ({
	useQuery: (...args: unknown[]) => mockUseQuery(...args),
	useMutation: (...args: unknown[]) => mockUseMutation(...args),
	useConvexAuth: () => ({ isAuthenticated: true, isLoading: false }),
}));

jest.mock("@/lib/auth-client", () => ({
	authClient: {
		signOut: jest.fn(),
		useSession: () => ({ data: { user: { id: "user" } }, isPending: false }),
	},
}));

jest.mock("@/shared/hooks/use-profile-gate", () => ({
	useProfileGate: () => ({
		isAuthReady: true,
		isLoading: false,
		profile: { currencyCode: "PEN", name: "Edzon" },
	}),
}));

jest.mock("@/shared/components/ui/reicon", () => ({
	ChevronRight: () => null,
	X: () => null,
	Check: () => null,
}));

jest.mock("@/shared/components/app-shell", () => {
	const { View } = require("react-native");
	return {
		__esModule: true,
		default: ({ children }: { children?: ReactNode }) => <View>{children}</View>,
	};
});

jest.mock("expo-router", () => ({
	useRouter: () => ({ push: jest.fn() }),
}));

jest.mock("@expo/ui", () => {
	const { View } = require("react-native");
	return {
		BottomSheet: ({ isPresented, children }: { isPresented: boolean; children: ReactNode }) =>
			isPresented ? <View>{children}</View> : null,
		RNHostView: ({ children }: { children: ReactNode }) => <View>{children}</View>,
	};
});

function cycleSentence(cycle: typeof closedCycleOnSummary) {
	const start = limaDayLabel(cycle.startDate);
	const end = limaDayLabel(cycle.endDate);
	const ended = `Tu ciclo del ${start} al ${end} terminó.`;
	const kept = "Tus movimientos siguen guardados.";
	if (cycle.surplusCents === 0) return `${ended} ${kept}`;
	return `${ended} Te sobraron ${formatCentsTrimmed(cycle.surplusCents)}. ${kept}`;
}

function renderHome() {
	return render(
		<RegistrarProvider>
			<HomePage />
		</RegistrarProvider>,
	);
}

describe("Inicio con ciclo cerrado", () => {
	beforeEach(() => {
		jest.clearAllMocks();
		moveMock.mockResolvedValue(null);
		mockUseMutation.mockReturnValue(moveMock);
		mockUseQuery.mockImplementation((query: unknown) => {
			const name = getFunctionName(query as Parameters<typeof getFunctionName>[0]);
			if (name === "dashboard:getSummary") return summaryAfterClose(closedCycleOnSummary);
			if (name === "savings:getClosedCycleSurplus") return closedCycleSurplus;
			return undefined;
		});
	});

	afterEach(() => {
		cleanup();
	});

	it("muestra la tarjeta con las fechas y el monto del ciclo cerrado, sin el dibujo de vacío", async () => {
		const view = await renderHome();
		expect(view.getByText("E")).toBeTruthy();
		expect(view.getByText("Edzon")).toBeTruthy();
		expect(view.getByText(cycleSentence(closedCycleOnSummary))).toBeTruthy();
		expect(view.queryByText("Aún no hay ciclo")).toBeNull();
		expect(
			view.queryByText("Registra tu primer ingreso para ver cuánto puedes gastar hoy."),
		).toBeNull();
		expect(view.queryByText(closedCycleSurplus.closedCycleId)).toBeNull();
	});

	it("omite el sobrante y Mover al Fondo cuando el sobrante es 0", async () => {
		mockUseQuery.mockImplementation((query: unknown) => {
			const name = getFunctionName(query as Parameters<typeof getFunctionName>[0]);
			if (name === "dashboard:getSummary") {
				return summaryAfterClose({ ...closedCycleOnSummary, surplusCents: 0 });
			}
			if (name === "savings:getClosedCycleSurplus") return { ...closedCycleSurplus, total: 0 };
			return undefined;
		});
		const view = await renderHome();
		expect(view.queryByText(/Te sobraron/)).toBeNull();
		expect(view.queryByText("Mover al Fondo")).toBeNull();
		expect(view.queryByRole("button", { name: "Mover al Fondo" })).toBeNull();
		expect(view.getByText(/Tus movimientos siguen guardados/)).toBeTruthy();
	});

	it("muestra Ya lo moviste cuando el sobrante ya se movió", async () => {
		mockUseQuery.mockImplementation((query: unknown) => {
			const name = getFunctionName(query as Parameters<typeof getFunctionName>[0]);
			if (name === "dashboard:getSummary") {
				return summaryAfterClose({
					...closedCycleOnSummary,
					surplusMovedAt: 1_700_000_000_000,
				});
			}
			if (name === "savings:getClosedCycleSurplus") {
				return { ...closedCycleSurplus, movedAt: 1_700_000_000_000 };
			}
			return undefined;
		});
		const view = await renderHome();
		expect(view.getByText("Ya lo moviste")).toBeTruthy();
		expect(view.queryByText("Mover al Fondo")).toBeNull();
		expect(view.queryByRole("button", { name: "Mover al Fondo" })).toBeNull();
	});

	it("Mover al Fondo llama a la mutación una sola vez con doble tap", async () => {
		let release: (value: null) => void = () => {};
		moveMock.mockImplementation(
			() =>
				new Promise((resolve) => {
					release = resolve;
				}),
		);
		const view = await renderHome();
		const button = view.getByRole("button", { name: "Mover al Fondo" });
		await fireEvent.press(button);
		await fireEvent.press(button);
		expect(moveMock).toHaveBeenCalledTimes(1);
		expect(moveMock).toHaveBeenCalledWith({ closedCycleId: closedCycleSurplus.closedCycleId });
		expect(getFunctionName(mockUseMutation.mock.calls[0]?.[0])).toBe(
			"savings:moveClosedCycleSurplusToFund",
		);
		await act(async () => {
			release(null);
		});
	});

	it("muestra un error en español si la mutación falla, sin el texto del servidor", async () => {
		moveMock.mockRejectedValue(new Error("INTERNAL_SERVER_BOOM"));
		const view = await renderHome();
		await fireEvent.press(view.getByRole("button", { name: "Mover al Fondo" }));
		expect(view.getByText("No se pudo mover el sobrante al Fondo.")).toBeTruthy();
		expect(view.queryByText(/INTERNAL_SERVER_BOOM/)).toBeNull();
	});

	it("Registrar nuevo ingreso abre el sheet en Ingreso", async () => {
		const view = await renderHome();
		await fireEvent.press(view.getByRole("button", { name: "Registrar nuevo ingreso" }));
		expect(view.getByText("REGISTRAR INGRESO")).toBeTruthy();
		expect(view.getByRole("button", { name: "Ingreso" }).props.accessibilityState.selected).toBe(
			true,
		);
		expect(view.getByRole("button", { name: "Gasto" }).props.accessibilityState.disabled).toBe(
			true,
		);
	});

	it("muestra el dibujo de vacío cuando no hay ciclo ni ciclo cerrado", async () => {
		mockUseQuery.mockImplementation((query: unknown) => {
			const name = getFunctionName(query as Parameters<typeof getFunctionName>[0]);
			if (name === "dashboard:getSummary") return summaryWithoutCycle;
			return null;
		});
		const view = await renderHome();
		expect(view.getByText("Aún no hay ciclo")).toBeTruthy();
		expect(
			view.getByText("Registra tu primer ingreso para ver cuánto puedes gastar hoy."),
		).toBeTruthy();
		expect(view.queryByText(/Tu ciclo del/)).toBeNull();
		expect(view.queryByText("Mover al Fondo")).toBeNull();
	});
});
