import { fireEvent, render, screen } from "@testing-library/react-native";
import { Welcome } from "@/modules/onboarding/components/welcome";

const mockPush = jest.fn();

jest.mock("expo-router", () => ({
	useRouter: () => ({ push: mockPush }),
}));

describe("Welcome", () => {
	beforeEach(() => {
		jest.clearAllMocks();
	});

	it("muestra el título, el ejemplo y los dos botones", async () => {
		await render(<Welcome />);
		expect(screen.getByText("Divide tu dinero antes de gastarlo")).toBeTruthy();
		expect(screen.getByText("EJEMPLO · PUEDES GASTAR HOY")).toBeTruthy();
		expect(screen.getByText("S/ 42.30")).toBeTruthy();
		expect(screen.getByText("Crear cuenta")).toBeTruthy();
		expect(screen.getByLabelText("Ya tengo cuenta")).toBeTruthy();
	});

	it("Crear cuenta abre el registro y Ya tengo cuenta abre el ingreso", async () => {
		await render(<Welcome />);
		fireEvent.press(screen.getByText("Crear cuenta"));
		expect(mockPush).toHaveBeenCalledWith("/(auth)/create-account");
		fireEvent.press(screen.getByText("Ya tengo cuenta"));
		expect(mockPush).toHaveBeenCalledWith("/(auth)/sign-in");
	});
});
