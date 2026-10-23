import { cleanup, render } from "@testing-library/react-native";
import { Platform } from "react-native";
import { summaryWithCycle } from "@/__fixtures__/dashboard-summary";
import HomePage from "@/app/(tabs)";
import { mapDashboardHome } from "@/shared/lib/dashboard/home-model";
import spendableToday from "@/widgets/SpendableToday";

const mockUseHomeModel = jest.fn();

jest.mock("expo-router", () => ({
	useRouter: () => ({ push: jest.fn() }),
}));

jest.mock("@/shared/components/navigation/registrar-context", () => ({
	useRegistrar: () => ({ openCreate: jest.fn(), openEdit: jest.fn() }),
}));

jest.mock("@/shared/hooks/use-dashboard", () => ({
	useHomeModel: () => mockUseHomeModel(),
}));

function setPlatform(os: typeof Platform.OS) {
	Object.defineProperty(Platform, "OS", { configurable: true, get: () => os });
}

function readyHome(dailyCents: number) {
	const summary = summaryWithCycle();
	summary.hero.displayDailyCents = dailyCents;
	const home = mapDashboardHome(summary);
	if (!home) throw new Error("summaryWithCycle did not produce a home model");
	return {
		status: "ready" as const,
		profileName: summary.profile.name,
		profileInitial: "E",
		home,
	};
}

describe("spendable widget", () => {
	const previousPlatform = Platform.OS;

	beforeEach(() => {
		jest.clearAllMocks();
		setPlatform("android");
	});

	afterEach(() => {
		cleanup();
		setPlatform(previousPlatform);
		jest.useRealTimers();
	});

	it("updates when Home's amount changes", async () => {
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
		mockUseHomeModel.mockReturnValue(readyHome(4230));
		const view = await render(<HomePage />);

		expect(spendableToday.updateSnapshot).toHaveBeenCalledWith({
			headline: "Puedes gastar hoy S/ 42.30",
			updated: "Actualizado 9:41",
		});

		mockUseHomeModel.mockReturnValue(readyHome(1500));
		await view.rerender(<HomePage />);

		expect(spendableToday.updateSnapshot).toHaveBeenLastCalledWith({
			headline: "Puedes gastar hoy S/ 15.00",
			updated: "Actualizado 9:41",
		});
	});

	it("shows Abre Quipu when Home has no amount", async () => {
		mockUseHomeModel.mockReturnValue({
			status: "empty",
			profileName: "Edzon",
			profileInitial: "E",
		});
		await render(<HomePage />);

		expect(spendableToday.updateSnapshot).toHaveBeenCalledWith({
			headline: "Abre Quipu",
			updated: "",
		});
	});
});
