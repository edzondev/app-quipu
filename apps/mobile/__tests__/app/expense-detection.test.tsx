import { render } from "@testing-library/react-native";
import ExpenseDetectionPage from "@/app/expense-detection";

const mockBack = jest.fn();
let onClose: (() => void) | null = null;

jest.mock("expo-router", () => ({
	useRouter: () => ({ back: mockBack }),
}));

jest.mock("@/shared/components/app-shell", () => {
	const { View } = require("react-native");
	return {
		__esModule: true,
		default: ({ children }: { children: unknown }) => <View>{children}</View>,
	};
});

jest.mock("@/shared/components/settings/expense-detection-screen", () => ({
	ExpenseDetectionScreen: (props: { onClose: () => void }) => {
		onClose = props.onClose;
		return null;
	},
}));

describe("ExpenseDetectionPage", () => {
	beforeEach(() => {
		mockBack.mockReset();
		onClose = null;
	});

	it("cerrar la pantalla vuelve a la anterior", async () => {
		await render(<ExpenseDetectionPage />);
		onClose?.();
		expect(mockBack).toHaveBeenCalledTimes(1);
	});
});
