import { cleanup, fireEvent, render } from "@testing-library/react-native";
import type { ReactNode } from "react";
import { summaryWithCycle, summaryWithoutCycle } from "@/__fixtures__/dashboard-summary";
import RegistrarSheet from "@/shared/components/navigation/registrar-sheet";

const mockUseHomeModel = jest.fn();
const mockSummary = jest.fn();

jest.mock("@/shared/components/ui/reicon", () => ({
	ChevronRight: () => null,
}));

jest.mock("@expo/ui", () => {
	const { View } = require("react-native");
	return {
		BottomSheet: ({ isPresented, children }: { isPresented: boolean; children: ReactNode }) =>
			isPresented ? <View>{children}</View> : null,
		RNHostView: ({ children }: { children: ReactNode }) => <View>{children}</View>,
		ScrollView: ({ children }: { children: ReactNode }) => <View>{children}</View>,
	};
});

jest.mock("expo-router", () => ({
	useRouter: () => ({ push: jest.fn() }),
}));

jest.mock("@/shared/hooks/use-dashboard", () => ({
	useHomeModel: () => mockUseHomeModel(),
	useDashboardSummary: () => mockSummary(),
}));

const mockProfile = jest.fn();

jest.mock("@/shared/hooks/use-profile-gate", () => ({
	useProfileGate: () => ({ profile: mockProfile() }),
}));

jest.mock("@/shared/hooks/use-expense-actions", () => ({
	useExpenseActions: () => ({ register: jest.fn() }),
}));

jest.mock("@/shared/hooks/use-income-actions", () => ({
	useIncomeActions: () => ({ register: jest.fn() }),
}));

const home = mockUseHomeModel;

const readyHome = {
	status: "ready" as const,
	profileName: "Edzon",
	profileInitial: "E",
	home: { currencySymbol: "S/", dailyCents: 4200 },
};

describe("RegistrarSheet", () => {
	beforeEach(() => {
		mockProfile.mockReturnValue({ currencyCode: "PEN" });
	});

	afterEach(() => {
		cleanup();
	});

	it("un perfil dependiente ofrece los extraordinarios de planilla", async () => {
		mockSummary.mockReturnValue(summaryWithCycle());
		home.mockReturnValue(readyHome);
		mockProfile.mockReturnValue({ currencyCode: "PEN", incomeModel: "fixed" });
		const view = await render(
			<RegistrarSheet isPresented session={{ nonce: 6, intent: "income" }} onDismiss={jest.fn()} />,
		);
		expect(view.getByTestId("income-extra-cts")).toBeTruthy();
		expect(view.getByTestId("income-extra-gratification_december")).toBeTruthy();
	});

	it("un perfil variable solo tiene «Extra», sin tipos que elegir", async () => {
		mockSummary.mockReturnValue(summaryWithCycle());
		home.mockReturnValue(readyHome);
		mockProfile.mockReturnValue({ currencyCode: "PEN", incomeModel: "variable" });
		const view = await render(
			<RegistrarSheet isPresented session={{ nonce: 7, intent: "income" }} onDismiss={jest.fn()} />,
		);
		expect(view.getByTestId("income-mode-add")).toBeTruthy();
		expect(view.queryByTestId("income-extra-types")).toBeNull();
	});

	it("abre en Ingreso cuando no hay ciclo", async () => {
		mockSummary.mockReturnValue(summaryWithoutCycle);
		home.mockReturnValue({
			status: "empty",
			profileName: "Edzon",
			profileInitial: "E",
		});
		const view = await render(
			<RegistrarSheet isPresented session={{ nonce: 1, intent: "auto" }} onDismiss={jest.fn()} />,
		);

		expect(view.getByText("Registrar ingreso")).toBeTruthy();
		expect(view.getByRole("button", { name: "Ingreso" }).props.accessibilityState.selected).toBe(
			true,
		);
		expect(view.queryByText("NUEVO GASTO")).toBeNull();
	});

	it("sin ciclo no deja elegir Gasto ni abrir el detalle", async () => {
		mockSummary.mockReturnValue(summaryWithoutCycle);
		home.mockReturnValue({
			status: "empty",
			profileName: "Edzon",
			profileInitial: "E",
		});
		const view = await render(
			<RegistrarSheet
				isPresented
				session={{ nonce: 3, intent: "expense" }}
				onDismiss={jest.fn()}
			/>,
		);

		const gasto = view.getByRole("button", { name: "Gasto" });
		expect(gasto.props.accessibilityState.disabled).toBe(true);
		await fireEvent.press(gasto);
		expect(view.queryByText("NUEVO GASTO")).toBeNull();
		expect(view.queryByLabelText("Abrir detalle del gasto")).toBeNull();
		expect(view.getByText("Registrar ingreso")).toBeTruthy();
		expect(view.getByTestId("income-mode-new-cycle")).toBeTruthy();
		expect(view.queryByTestId("income-mode-add")).toBeNull();
		expect(view.queryByText("Tu sueldo empieza un ciclo nuevo")).toBeNull();
	});

	it("abre en Gasto cuando hay ciclo y el botón central no pide ingreso", async () => {
		mockSummary.mockReturnValue(summaryWithCycle());
		home.mockReturnValue(readyHome);
		const view = await render(
			<RegistrarSheet isPresented session={{ nonce: 2, intent: "auto" }} onDismiss={jest.fn()} />,
		);

		expect(view.getByText("NUEVO GASTO")).toBeTruthy();
		expect(view.getByRole("button", { name: "Gasto" }).props.accessibilityState.selected).toBe(
			true,
		);
		expect(view.getByRole("button", { name: "Gasto" }).props.accessibilityState.disabled).toBe(
			false,
		);
		await fireEvent.press(view.getByRole("button", { name: "Ingreso" }));
		expect(view.getByTestId("income-mode-new-cycle")).toBeTruthy();
		expect(view.getByTestId("income-mode-add")).toBeTruthy();
		expect(view.getByTestId("income-mode-add").props.accessibilityState.selected).toBe(true);
		expect(view.queryByText("Tu sueldo empieza un ciclo nuevo")).toBeNull();
		expect(view.queryByText("Cierra este ciclo y empieza uno nuevo")).toBeNull();
	});

	it("con ciclo vencido ofrece Gasto y deja empezar un ciclo nuevo", async () => {
		const open = summaryWithCycle();
		mockSummary.mockReturnValue({
			...open,
			cycle: { ...open.cycle, pastEnd: true },
			closedCycle: {
				cycleId: open.cycle.id,
				startDate: open.cycle.startDate,
				endDate: open.cycle.endDate,
				surplusCents: -1_500,
				surplusMovedAt: null,
			},
		});
		home.mockReturnValue({
			status: "closed",
			profileName: "Edzon",
			profileInitial: "E",
			currencySymbol: "S/",
			closedCycle: {
				cycleId: open.cycle.id,
				startDate: open.cycle.startDate,
				endDate: open.cycle.endDate,
				surplusCents: -1_500,
				surplusMovedAt: null,
			},
		});
		const view = await render(
			<RegistrarSheet isPresented session={{ nonce: 4, intent: "income" }} onDismiss={jest.fn()} />,
		);
		expect(view.getByRole("button", { name: "Gasto" }).props.accessibilityState.disabled).toBe(
			false,
		);
		expect(view.getByTestId("income-mode-new-cycle")).toBeTruthy();
		expect(view.getByTestId("income-mode-add")).toBeTruthy();
		expect(view.getByTestId("income-mode-new-cycle").props.accessibilityState.selected).toBe(true);
		expect(view.queryByText("Cierra este ciclo y empieza uno nuevo")).toBeNull();
		expect(view.queryByText("Tu sueldo empieza un ciclo nuevo")).toBeNull();
	});

	it("mientras carga no muestra la variante sin ciclo", async () => {
		mockSummary.mockReturnValue(undefined);
		home.mockReturnValue({ status: "loading" });
		const view = await render(
			<RegistrarSheet isPresented session={{ nonce: 5, intent: "auto" }} onDismiss={jest.fn()} />,
		);
		expect(view.getByText("Cargando…")).toBeTruthy();
		expect(view.queryByText("Tu sueldo empieza un ciclo nuevo")).toBeNull();
		expect(view.queryByText("Cierra este ciclo y empieza uno nuevo")).toBeNull();
		expect(view.queryByTestId("income-mode-new-cycle")).toBeNull();
		expect(view.queryByTestId("income-mode-add")).toBeNull();
		expect(view.queryByText("Registrar ingreso")).toBeNull();
	});
});
