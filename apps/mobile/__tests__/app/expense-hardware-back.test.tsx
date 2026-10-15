import { act, cleanup, render } from "@testing-library/react-native";
import { BackHandler } from "react-native";
import ExpenseDetailScreen from "@/app/expense/[id]";

const mockBack = jest.fn();
const mockReplace = jest.fn();
const mockCanGoBack = jest.fn(() => true);
const mockUpdate = jest.fn();

jest.mock("expo-router", () => {
	const React = require("react");
	return {
		useRouter: () => ({
			back: mockBack,
			replace: mockReplace,
			canGoBack: () => mockCanGoBack(),
		}),
		useLocalSearchParams: () => ({ id: "exp_1" }),
		useFocusEffect: (callback: () => undefined | (() => void)) => {
			React.useEffect(() => {
				const cleanup = callback();
				return typeof cleanup === "function" ? cleanup : undefined;
			}, [callback]);
		},
	};
});

jest.mock("@quipu/convex-api", () => ({ api: { movements: {}, expenses: {} } }), {
	virtual: true,
});

jest.mock("convex/react", () => ({
	useQuery: () => undefined,
}));

jest.mock("@/shared/hooks/use-dashboard", () => ({
	useHomeModel: () => ({ status: "loading" }),
}));

jest.mock("@/shared/hooks/use-profile-gate", () => ({
	useProfileGate: () => ({ isAuthReady: true, profile: { currencyCode: "PEN" } }),
}));

jest.mock("@/shared/hooks/use-expense-actions", () => ({
	useExpenseActions: () => ({
		register: jest.fn(),
		update: (...args: unknown[]) => mockUpdate(...args),
		remove: jest.fn(),
	}),
}));

jest.mock("@/shared/components/expenses/expense-detail-form", () => {
	const { Text } = require("react-native");
	return {
		ExpenseDetailForm: () => <Text>EDITAR GASTO</Text>,
	};
});

jest.mock("uniwind", () => ({
	withUniwind: (Component: unknown) => Component,
}));

function pressHardwareBack() {
	const registration = jest.mocked(BackHandler.addEventListener).mock.calls.at(-1);
	const handler = registration?.[1];
	if (!handler) throw new Error("no hardware back handler");
	return handler({ type: "hardwareBackPress", timeStamp: 0 });
}

describe("EDITAR GASTO hardware back", () => {
	beforeEach(() => {
		jest.clearAllMocks();
		mockCanGoBack.mockReturnValue(true);
		jest.spyOn(BackHandler, "addEventListener").mockImplementation(() => ({ remove: jest.fn() }));
	});

	afterEach(() => {
		cleanup();
		jest.restoreAllMocks();
	});

	it("vuelve sin guardar", async () => {
		await render(<ExpenseDetailScreen />);
		await act(async () => {
			expect(pressHardwareBack()).toBe(true);
		});
		expect(mockBack).toHaveBeenCalled();
		expect(mockUpdate).not.toHaveBeenCalled();
	});
});
