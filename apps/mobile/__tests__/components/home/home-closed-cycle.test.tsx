import { cleanup, fireEvent, render } from "@testing-library/react-native";
import { getFunctionName } from "convex/server";
import type { ReactNode } from "react";
import {
	closedCycleOnSummary,
	summaryAfterClose,
	summaryWithoutCycle,
} from "@/__fixtures__/dashboard-summary";
import HomePage from "@/app/(tabs)";
import { RegistrarProvider } from "@/shared/components/navigation/registrar-context";

const mockUseQuery = jest.fn();

jest.mock("convex/react", () => ({
	useQuery: (...args: unknown[]) => mockUseQuery(...args),
	useConvexAuth: () => ({ isAuthenticated: true, isLoading: false }),
	useConvexConnectionState: () => ({
		isWebSocketConnected: true,
		hasEverConnected: true,
		connectionRetries: 0,
	}),
}));

jest.mock("@/shared/hooks/use-expense-actions", () => ({
	useExpenseActions: () => ({ register: jest.fn() }),
}));

jest.mock("@/shared/hooks/use-income-actions", () => ({
	useIncomeActions: () => ({ register: jest.fn() }),
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

const WITH_SURPLUS =
	"Tu ciclo del 1 AGO al 30 AGO terminó. Te quedaron S/ 210 y se suman a tu próximo ingreso. Tus movimientos siguen guardados.";
const NEUTRAL = "Tu ciclo del 1 AGO al 30 AGO terminó. Tus movimientos siguen guardados.";

function summaryFor(surplusCents: number) {
	return summaryAfterClose({ ...closedCycleOnSummary, surplusCents });
}

function mockSummary(summary: ReturnType<typeof summaryAfterClose> | typeof summaryWithoutCycle) {
	mockUseQuery.mockImplementation((query: unknown) => {
		const name = getFunctionName(query as Parameters<typeof getFunctionName>[0]);
		if (name === "dashboard:getSummary") return summary;
		return undefined;
	});
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
		mockSummary(summaryAfterClose(closedCycleOnSummary));
	});

	afterEach(() => {
		cleanup();
	});

	it("muestra el monto y que se suma al próximo ingreso, sin el dibujo de vacío", async () => {
		const view = await renderHome();
		expect(view.getByText("E")).toBeTruthy();
		expect(view.getByText("Edzon")).toBeTruthy();
		expect(view.getByText(WITH_SURPLUS)).toBeTruthy();
		expect(view.queryByText("Aún no hay ciclo")).toBeNull();
		expect(
			view.queryByText("Registra tu primer ingreso para ver cuánto puedes gastar hoy."),
		).toBeNull();
		expect(view.queryByText("Mover al Fondo")).toBeNull();
		expect(view.queryByRole("button", { name: "Mover al Fondo" })).toBeNull();
	});

	it("con sobrante 0 muestra el texto neutro y no ofrece Mover al Fondo", async () => {
		mockSummary(summaryFor(0));
		const view = await renderHome();
		expect(view.getByText(NEUTRAL)).toBeTruthy();
		expect(view.queryByText(/Te quedaron/)).toBeNull();
		expect(view.queryByText("Mover al Fondo")).toBeNull();
	});

	it("con sobrante negativo muestra el texto neutro y no ofrece Mover al Fondo", async () => {
		mockSummary(summaryFor(-1500));
		const view = await renderHome();
		expect(view.getByText(NEUTRAL)).toBeTruthy();
		expect(view.queryByText(/Te quedaron/)).toBeNull();
		expect(view.queryByText(/S\//)).toBeNull();
		expect(view.queryByText("Mover al Fondo")).toBeNull();
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
		mockSummary(summaryWithoutCycle);
		const view = await renderHome();
		expect(view.getByText("Aún no hay ciclo")).toBeTruthy();
		expect(
			view.getByText("Registra tu primer ingreso para ver cuánto puedes gastar hoy."),
		).toBeTruthy();
		expect(view.queryByText(/Tu ciclo del/)).toBeNull();
		expect(view.queryByText("Mover al Fondo")).toBeNull();
	});
});
