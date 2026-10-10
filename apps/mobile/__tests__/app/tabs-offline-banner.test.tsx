import { act, cleanup, render } from "@testing-library/react-native";
import HomePage from "@/app/(tabs)";
import TabLayout from "@/app/(tabs)/_layout";
import { OFFLINE_BANNER_DEBOUNCE_MS } from "@/shared/components/offline/offline-banner";

const mockConnectionState = jest.fn();
const mockTabScreens: { name: string; options?: { popToTopOnBlur?: boolean } }[] = [];

jest.mock("convex/react", () => ({
	useConvexConnectionState: () => mockConnectionState(),
}));

jest.mock("expo-router", () => {
	const { View } = require("react-native");
	function Tabs({ children }: { children?: unknown }) {
		return <View testID="tabs-slot">{children}</View>;
	}
	Tabs.Screen = (props: { name: string; options?: { popToTopOnBlur?: boolean } }) => {
		mockTabScreens.push(props);
		return null;
	};
	return {
		Tabs,
		Redirect: () => null,
		useRouter: () => ({ push: jest.fn() }),
	};
});

jest.mock("@/shared/components/auth/onboarding-gate", () => ({
	__esModule: true,
	default: ({ children }: { children?: unknown }) => children,
}));

jest.mock("@/shared/components/navigation/registrar-context", () => ({
	RegistrarProvider: ({ children }: { children?: unknown }) => children,
	useRegistrar: () => ({ openCreate: jest.fn(), openEdit: jest.fn() }),
}));

jest.mock("@/lib/auth-client", () => ({
	authClient: { signOut: jest.fn() },
}));

jest.mock("@/shared/hooks/use-dashboard", () => ({
	useHomeModel: () => ({
		status: "ready",
		profileInitial: "E",
		profileName: "Edzon",
		home: {
			cycleLabel: "Ciclo",
			cycleDay: 1,
			cycleTotal: 30,
			daysLeft: 29,
			cycleProgress: 0,
			badgeLabel: "Estable",
			badgeTone: "stable",
			cycleStatusLabel: "Ciclo estable",
			dailyCents: 100,
			heroSubtitle: "",
			currencySymbol: "S/",
			envelopes: [],
			envelopesBalanceCents: 0,
			surplusCents: 0,
			coachMessage: null,
			commitments: [],
			recentMovements: [],
		},
	}),
}));

function offline() {
	mockConnectionState.mockReturnValue({
		isWebSocketConnected: false,
		hasEverConnected: true,
		connectionRetries: 0,
	});
}

describe("franja offline en el layout de pestañas", () => {
	beforeEach(() => {
		mockConnectionState.mockReset();
		jest.useFakeTimers({ doNotFake: ["nextTick", "queueMicrotask", "setImmediate"] });
		offline();
	});

	afterEach(() => {
		cleanup();
		jest.useRealTimers();
	});

	async function advance() {
		await act(async () => {
			await jest.advanceTimersByTimeAsync(OFFLINE_BANNER_DEBOUNCE_MS);
		});
	}

	it("se monta una vez en el layout y empuja bajo el safe area superior", async () => {
		const view = await render(<TabLayout />);
		await advance();

		expect(view.getAllByText("Sin conexión")).toHaveLength(1);
		const inset = view.getByTestId("tabs-top-inset");
		expect(inset.props.edges).toEqual({
			bottom: "off",
			left: "off",
			right: "off",
			top: "additive",
		});
		expect(inset.props.mode).toBe("padding");
		expect(view.getByLabelText("Sin conexión").props.style?.position).not.toBe("absolute");
	});

	it("Plan y Progreso vuelven a su pantalla raíz al salir de la pestaña", async () => {
		mockTabScreens.length = 0;
		await render(<TabLayout />);

		const resetOnBlur = mockTabScreens
			.filter((screen) => screen.options?.popToTopOnBlur)
			.map((screen) => screen.name);
		expect(resetOnBlur.sort()).toEqual(["envelopes", "savings"]);
	});

	it("no se monta en Inicio", async () => {
		const view = await render(<HomePage />);
		await advance();

		expect(view.queryByText("Sin conexión")).toBeNull();
		expect(view.getByText("Hola, Edzon")).toBeTruthy();
	});
});
