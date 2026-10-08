import { fireEvent, render } from "@testing-library/react-native";
import HomePage from "@/app/(tabs)";
import { HomeDense } from "@/shared/components/home/home-dense";
import { HomeEmpty } from "@/shared/components/home/home-empty";
import type { HomeModel } from "@/shared/lib/dashboard/home-model";

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
};

const mockPush = jest.fn();

jest.mock("expo-router", () => ({
	useRouter: () => ({ push: mockPush }),
}));

jest.mock("@/shared/hooks/use-dashboard", () => ({
	useHomeModel: () => ({ status: "ready", profileInitial: "E", home: mockHome }),
}));

describe("Home 1d", () => {
	it("centra el vacío cuando no hay ciclo y no pinta filas con raya", async () => {
		const view = await render(<HomeEmpty />);
		expect(view.getByText("Aún no hay ciclo")).toBeTruthy();
		expect(
			view.getByText("Registra tu primer ingreso para ver cuánto puedes gastar hoy."),
		).toBeTruthy();
		expect(view.queryByText("—")).toBeNull();
		expect(view.queryByText("Necesid.")).toBeNull();
	});

	it("muestra el ciclo denso con datos vivos y sin placeholders", async () => {
		const onViewAllMovements = jest.fn();
		const view = await render(
			<HomeDense
				home={mockHome}
				profileInitial="E"
				onOpenSettings={jest.fn()}
				onViewAllMovements={onViewAllMovements}
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

		fireEvent.press(view.getByText("Ver todos"));
		expect(onViewAllMovements).toHaveBeenCalledTimes(1);
	});

	it("no inventa filas cuando el ciclo no tiene compromisos ni movimientos", async () => {
		const view = await render(
			<HomeDense
				home={{ ...mockHome, commitments: [], recentMovements: [] }}
				profileInitial="E"
				onOpenSettings={jest.fn()}
				onViewAllMovements={jest.fn()}
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
		expect(view.getByText("Salir")).toBeTruthy();
		fireEvent.press(view.getByRole("button", { name: "Ajustes" }));
		expect(mockPush).toHaveBeenCalledWith("/ajustes");
	});
});
