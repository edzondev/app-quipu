import { cleanup, fireEvent, render, waitFor } from "@testing-library/react-native";
import type { ReactNode } from "react";
import { Platform } from "react-native";
import { summaryWithCycle } from "@/__fixtures__/dashboard-summary";
import RegistrarSheet from "@/shared/components/navigation/registrar-sheet";
import { updateSpendableWidget } from "@/widgets/SpendableToday";

const mockUpdateSnapshot = jest.fn();

jest.mock("expo-widgets", () => ({
	createWidget: () => ({
		updateSnapshot: (...args: unknown[]) => mockUpdateSnapshot(...args),
	}),
}));

jest.mock("@expo/ui/jetpack-compose", () => ({
	Column: () => null,
	Text: () => null,
	Spacer: () => null,
}));

jest.mock("@expo/ui/jetpack-compose/modifiers", () => ({
	background: () => ({}),
	fillMaxSize: () => ({}),
	paddingAll: () => ({}),
	height: () => ({}),
}));

jest.mock("@/shared/components/ui/reicon", () => {
	const Icon = () => null;
	return new Proxy(
		{ __esModule: true },
		{ get: (target, prop) => (prop in target ? target[prop as keyof typeof target] : Icon) },
	);
});

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

const mockUseHomeModel = jest.fn();
const mockSummary = jest.fn();

jest.mock("@/shared/hooks/use-dashboard", () => ({
	useHomeModel: () => mockUseHomeModel(),
	useDashboardSummary: () => mockSummary(),
}));

jest.mock("@/shared/hooks/use-profile-gate", () => ({
	useProfileGate: () => ({ profile: { currencyCode: "PEN" } }),
}));

const mockRegister = jest.fn();

jest.mock("@/shared/hooks/use-expense-actions", () => ({
	useExpenseActions: () => ({ register: (...args: unknown[]) => mockRegister(...args) }),
}));

jest.mock("@/shared/hooks/use-income-actions", () => ({
	useIncomeActions: () => ({ register: jest.fn() }),
}));

jest.mock("expo-network", () => ({
	getNetworkStateAsync: () => Promise.resolve({ isConnected: true, isInternetReachable: true }),
	useNetworkState: () => ({ isConnected: true, isInternetReachable: true }),
}));

function setPlatform(os: typeof Platform.OS) {
	Object.defineProperty(Platform, "OS", { configurable: true, get: () => os });
}

describe("spendable widget", () => {
	const previousPlatform = Platform.OS;

	beforeEach(() => {
		jest.clearAllMocks();
		setPlatform("android");
		mockRegister.mockResolvedValue({ expenseId: "e1" });
		mockSummary.mockReturnValue(summaryWithCycle());
		mockUseHomeModel.mockReturnValue({
			status: "ready",
			profileName: "Edzon",
			profileInitial: "E",
			home: { currencySymbol: "S/", dailyCents: 4230 },
		});
	});

	afterEach(() => {
		cleanup();
		setPlatform(previousPlatform);
		jest.useRealTimers();
	});

	it("after a saved expense, updates with the amount Home already shows", async () => {
		jest.useFakeTimers({
			now: new Date(2026, 9, 23, 9, 41, 0),
			doNotFake: [
				"setTimeout",
				"clearTimeout",
				"setInterval",
				"clearInterval",
				"nextTick",
				"queueMicrotask",
				"setImmediate",
			],
		});
		const view = await render(
			<RegistrarSheet isPresented session={{ nonce: 1, intent: "auto" }} onDismiss={jest.fn()} />,
		);

		await fireEvent.press(view.getByText("4"));
		await fireEvent.changeText(view.getByLabelText("Comercio"), "Café");
		await fireEvent.press(view.getByText("Necesidades"));
		await fireEvent.press(view.getByText("Registrar gasto"));

		await waitFor(() => {
			expect(mockUpdateSnapshot).toHaveBeenCalledWith({
				headline: "Puedes gastar hoy S/ 42.30",
				updated: "Actualizado 9:41",
			});
		});
		expect(mockRegister).toHaveBeenCalledTimes(1);
	});

	it("shows Abre Quipu when there is no amount", () => {
		updateSpendableWidget({
			amountCents: null,
			currencySymbol: "S/",
			updatedAt: new Date(2026, 9, 23, 9, 41, 0),
		});
		updateSpendableWidget({
			amountCents: null,
			currencySymbol: "S/",
			updatedAt: new Date(2026, 9, 23, 18, 5, 0),
		});

		expect(mockUpdateSnapshot).toHaveBeenNthCalledWith(1, {
			headline: "Abre Quipu",
			updated: "",
		});
		expect(mockUpdateSnapshot).toHaveBeenNthCalledWith(2, {
			headline: "Abre Quipu",
			updated: "",
		});
	});
});
