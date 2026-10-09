import { cleanup, render } from "@testing-library/react-native";
import type { ReactNode } from "react";
import RegistrarSheet from "@/shared/components/navigation/registrar-sheet";
import { useHomeModel } from "@/shared/hooks/use-dashboard";

jest.mock("@/shared/components/ui/reicon", () => ({
	ChevronRight: () => null,
}));

jest.mock("@expo/ui", () => {
	const { View } = require("react-native");
	return {
		BottomSheet: ({ isPresented, children }: { isPresented: boolean; children: ReactNode }) =>
			isPresented ? <View>{children}</View> : null,
		RNHostView: ({ children }: { children: ReactNode }) => <View>{children}</View>,
	};
});

jest.mock("expo-router", () => ({
	useRouter: () => ({ push: jest.fn() }),
}));

jest.mock("@/shared/hooks/use-dashboard", () => ({
	useHomeModel: jest.fn(),
}));

jest.mock("@/shared/hooks/use-profile-gate", () => ({
	useProfileGate: () => ({ profile: { currencyCode: "PEN" } }),
}));

jest.mock("@/shared/hooks/use-expense-actions", () => ({
	useExpenseActions: () => ({ register: jest.fn() }),
}));

jest.mock("@/shared/hooks/use-income-actions", () => ({
	useIncomeActions: () => ({ register: jest.fn() }),
}));

const home = useHomeModel as jest.Mock;

describe("RegistrarSheet", () => {
	afterEach(() => {
		cleanup();
	});

	it("abre en Ingreso cuando no hay ciclo", async () => {
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

	it("abre en Gasto cuando hay ciclo y el botón central no pide ingreso", async () => {
		home.mockReturnValue({
			status: "ready",
			profileName: "Edzon",
			profileInitial: "E",
			home: { currencySymbol: "S/", dailyCents: 4200 },
		});
		const view = await render(
			<RegistrarSheet isPresented session={{ nonce: 2, intent: "auto" }} onDismiss={jest.fn()} />,
		);

		expect(view.getByText("NUEVO GASTO")).toBeTruthy();
		expect(view.getByRole("button", { name: "Gasto" }).props.accessibilityState.selected).toBe(
			true,
		);
	});
});
