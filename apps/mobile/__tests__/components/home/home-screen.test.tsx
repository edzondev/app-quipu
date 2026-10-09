import { fireEvent, render } from "@testing-library/react-native";
import { envelope, summaryWithCycle } from "@/__fixtures__/dashboard-summary";
import HomePage from "@/app/(tabs)";
import { HomeDense } from "@/shared/components/home/home-dense";
import { HomeEmpty } from "@/shared/components/home/home-empty";
import { type HomeModel, mapDashboardHome } from "@/shared/lib/dashboard/home-model";

jest.mock("@/shared/components/app-shell", () => {
	const { View } = require("react-native");
	return {
		__esModule: true,
		default: ({ children }: { children?: unknown }) => <View>{children}</View>,
	};
});

jest.mock("@/lib/auth-client", () => ({
	authClient: {
		signOut: jest.fn(),
	},
}));

const mockHome: HomeModel = {
	cycleLabel: "Ciclo agosto",
	cycleDay: 15,
	cycleTotal: 30,
	daysLeft: 15,
	cycleProgress: 50,
	badgeLabel: "Estable",
	badgeTone: "stable",
	cycleStatusLabel: "Ciclo estable",
	dailyCents: 4230,
	heroSubtitle: "Sin tocar tus compromisos ni tu ahorro.",
	currencySymbol: "S/",
	envelopes: [
		{
			label: "Necesidades",
			shortLabel: "Necesid.",
			spentCents: 113800,
			remainingCents: 61200,
			remainingPercent: 35,
			totalCents: 175000,
			progress: 65,
			tone: "needs",
			suffix: "de 1,750",
			carriedOverCents: 0,
			incomeCents: 0,
			carryTotalCents: 0,
		},
		{
			label: "Gustos",
			shortLabel: "Gustos",
			spentCents: 81900,
			remainingCents: 23100,
			remainingPercent: 22,
			totalCents: 105000,
			progress: 78,
			tone: "wants",
			suffix: "de 1,050",
			carriedOverCents: 0,
			incomeCents: 0,
			carryTotalCents: 0,
		},
		{
			label: "Ahorro",
			shortLabel: "Ahorro",
			spentCents: 70000,
			remainingCents: 70000,
			remainingPercent: 100,
			totalCents: 70000,
			progress: 100,
			tone: "savings",
			suffix: "apartado",
			carriedOverCents: 0,
			incomeCents: 0,
			carryTotalCents: 0,
		},
	],
	envelopesBalanceCents: 154300,
	surplusCents: 154300,
	coachMessage: "Vas bien.",
	commitments: [
		{
			id: "rent",
			name: "Alquiler",
			amountCents: 110000,
			dueLabel: "mañana",
			dueTone: "soon",
		},
	],
	recentMovements: [
		{
			id: "e1",
			name: "Menú del día",
			amountCents: 1500,
			tone: "wants",
		},
	],
	isOpeningCycle: false,
};

const mockPush = jest.fn();

jest.mock("expo-router", () => ({
	useRouter: () => ({ push: mockPush }),
}));

const mockOpenCreate = jest.fn();

jest.mock("@/shared/components/navigation/registrar-context", () => ({
	useRegistrar: () => ({ openCreate: mockOpenCreate, openEdit: jest.fn() }),
}));

jest.mock("@/shared/hooks/use-dashboard", () => ({
	useHomeModel: () => ({
		status: "ready",
		profileInitial: "E",
		profileName: "Edzon",
		home: mockHome,
	}),
}));

describe("Home 1d", () => {
	it("centra el vacío cuando no hay ciclo y no pinta filas con raya", async () => {
		const onOpenSettings = jest.fn();
		const onRegisterIncome = jest.fn();
		const view = await render(
			<HomeEmpty
				name="Edzon"
				initial="E"
				onOpenSettings={onOpenSettings}
				onRegisterIncome={onRegisterIncome}
			/>,
		);
		expect(view.getByText("Aún no hay ciclo")).toBeTruthy();
		expect(
			view.getByText("Registra tu primer ingreso para ver cuánto puedes gastar hoy."),
		).toBeTruthy();
		expect(view.getByText("Edzon")).toBeTruthy();
		expect(view.getByText("E")).toBeTruthy();
		expect(view.getByText("+ Ingreso")).toBeTruthy();
		expect(view.getByText("Registrar ingreso")).toBeTruthy();
		expect(view.queryByText("Salir")).toBeNull();
		expect(view.queryByText("—")).toBeNull();
		expect(view.queryByText("Necesid.")).toBeNull();

		await fireEvent.press(view.getByRole("button", { name: "Ajustes" }));
		expect(onOpenSettings).toHaveBeenCalledTimes(1);
		await fireEvent.press(view.getByText("Registrar ingreso"));
		expect(onRegisterIncome).toHaveBeenCalledTimes(1);
	});

	it("muestra el ciclo denso con datos vivos y sin placeholders", async () => {
		const onViewAllMovements = jest.fn();
		const view = await render(
			<HomeDense
				home={mockHome}
				profileInitial="E"
				profileName="Edzon"
				onOpenSettings={jest.fn()}
				onViewAllMovements={onViewAllMovements}
				onRegisterIncome={jest.fn()}
			/>,
		);

		expect(view.getByText("Hoy puedes gastar")).toBeTruthy();
		expect(view.getByText("Sin tocar tus compromisos ni tu ahorro.")).toBeTruthy();
		expect(view.getByText(/Día 15\/30/)).toBeTruthy();
		expect(view.getByText("Ciclo estable")).toBeTruthy();
		expect(view.getByText(/Sobra S\/ 1,543/)).toBeTruthy();
		expect(view.getByText("42")).toBeTruthy();
		expect(view.getByText(".30")).toBeTruthy();
		expect(view.getByText("Sobres · queda")).toBeTruthy();
		expect(view.getByText("Necesid.")).toBeTruthy();
		expect(view.getByText("S/ 612")).toBeTruthy();
		expect(view.getByText("S/ 231")).toBeTruthy();
		expect(view.getByText("S/ 700")).toBeTruthy();
		expect(view.getByText("Próximos compromisos")).toBeTruthy();
		expect(view.getByText(/Alquiler/)).toBeTruthy();
		expect(view.getByText(/mañana/)).toBeTruthy();
		expect(view.getByText("S/ 1,100")).toBeTruthy();
		expect(view.getByText("Movimientos")).toBeTruthy();
		expect(view.getByText("Menú del día")).toBeTruthy();
		expect(view.getByText("− S/ 15.00")).toBeTruthy();
		expect(view.queryByText("—")).toBeNull();
		expect(view.queryByText(/Saldo que quedó/)).toBeNull();

		await fireEvent.press(view.getByText("Ver todos"));
		expect(onViewAllMovements).toHaveBeenCalledTimes(1);
	});

	function renderCarry(carriedOverCents: number, incomeCents: number, totalCents: number) {
		const home = mapDashboardHome(
			summaryWithCycle({
				envelopes: [
					{
						...envelope("needs", 61200, 175000),
						carriedOverCents,
						incomeCents,
						totalCents,
					},
				],
			}),
		);
		if (!home) throw new Error("expected home");
		return render(
			<HomeDense
				home={home}
				profileInitial="E"
				profileName="Edzon"
				onOpenSettings={jest.fn()}
				onViewAllMovements={jest.fn()}
				onRegisterIncome={jest.fn()}
			/>,
		);
	}

	it("muestra el arrastre positivo con los montos del resumen", async () => {
		const view = await renderCarry(12000, 80000, 91000);
		const line = view.getByText("Saldo que quedó S/ 120 + Ingreso S/ 800 = S/ 910");
		expect(line).toBeTruthy();
		expect(line.props.className).toContain("tabular-nums");
		expect(view.queryByText(/S\/ 920/)).toBeNull();
	});

	it("no muestra el arrastre en el ciclo de apertura", async () => {
		const base = summaryWithCycle({
			envelopes: [
				{
					...envelope("needs", 61200, 175000),
					carriedOverCents: 12000,
					incomeCents: 80000,
					totalCents: 91000,
				},
			],
		});
		const home = mapDashboardHome({
			...base,
			cycle: { ...base.cycle, isOpeningCycle: true },
		});
		if (!home) throw new Error("expected home");
		expect(home.isOpeningCycle).toBe(true);
		const view = await render(
			<HomeDense
				home={home}
				profileInitial="E"
				profileName="Edzon"
				onOpenSettings={jest.fn()}
				onViewAllMovements={jest.fn()}
				onRegisterIncome={jest.fn()}
			/>,
		);
		expect(view.queryByText(/Saldo que quedó/)).toBeNull();
	});

	it("no muestra la línea cuando el arrastre es 0", async () => {
		const view = await renderCarry(0, 80000, 80000);
		expect(view.queryByText(/Saldo que quedó/)).toBeNull();
	});

	it("muestra el arrastre negativo con el signo menos delante de S/", async () => {
		const view = await renderCarry(-5000, 80000, 75000);
		expect(view.getByText("Saldo que quedó \u2212S/ 50 + Ingreso S/ 800 = S/ 750")).toBeTruthy();
		expect(view.queryByText(/-S\//)).toBeNull();
		expect(view.queryByText(/S\/ -/)).toBeNull();
	});

	it("no inventa filas cuando el ciclo no tiene compromisos ni movimientos", async () => {
		const view = await render(
			<HomeDense
				home={{ ...mockHome, commitments: [], recentMovements: [] }}
				profileInitial="E"
				profileName="Edzon"
				onOpenSettings={jest.fn()}
				onViewAllMovements={jest.fn()}
				onRegisterIncome={jest.fn()}
			/>,
		);
		expect(view.getByText("Sin compromisos próximos.")).toBeTruthy();
		expect(view.getByText("Sin movimientos en este ciclo.")).toBeTruthy();
		expect(view.queryByText("—")).toBeNull();
	});

	it("el avatar muestra la inicial y abre Ajustes", async () => {
		mockPush.mockClear();
		const view = await render(<HomePage />);
		expect(view.getByText("E")).toBeTruthy();
		expect(view.getByText("Hola, Edzon")).toBeTruthy();
		expect(view.getByText("+ Ingreso")).toBeTruthy();
		expect(view.queryByText("Salir")).toBeNull();
		expect(view.queryByText("Cerrar sesión")).toBeNull();
		await fireEvent.press(view.getByRole("button", { name: "Ajustes" }));
		expect(mockPush).toHaveBeenCalledWith("/ajustes");
		await fireEvent.press(view.getByText("+ Ingreso"));
		expect(mockOpenCreate).toHaveBeenCalledWith("income");
	});
});
