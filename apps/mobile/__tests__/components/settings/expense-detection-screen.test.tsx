import { act, fireEvent, render } from "@testing-library/react-native";
import { AppState } from "react-native";
import { ExpenseDetectionScreen } from "@/shared/components/settings/expense-detection-screen";

const mockGetInstalledBanks = jest.fn();
const mockGetSources = jest.fn();
const mockAddSource = jest.fn();
const mockRemoveSource = jest.fn();

jest.mock("@/modules/quipu-notification-listener", () => ({
	getInstalledBanks: () => mockGetInstalledBanks(),
	getSources: () => mockGetSources(),
	addSource: (input: string) => mockAddSource(input),
	removeSource: (packageName: string) => mockRemoveSource(packageName),
}));

jest.mock("@/shared/components/ui/reicon", () => ({
	Check: () => null,
	ChevronLeft: () => null,
}));

const yape = {
	name: "Yape",
	packageId: "com.bcp.innovacxion.yapeapp",
	installed: true,
};
const bcp = {
	name: "Banca Móvil BCP",
	packageId: "com.bcp.bank.bcp",
	installed: true,
};
const interbank = {
	name: "Interbank APP",
	packageId: "pe.com.interbank.mobilebanking",
	installed: false,
};
const customId = "com.other.wallet";

let rendered: Awaited<ReturnType<typeof render>> | null = null;

async function openScreen(onClose = jest.fn()) {
	const view = await render(<ExpenseDetectionScreen onClose={onClose} />);
	rendered = view;
	expect(await view.findByText("¿Qué apps usas para pagar?")).toBeTruthy();
	return { view, onClose };
}

describe("ExpenseDetectionScreen", () => {
	beforeEach(() => {
		jest.spyOn(AppState, "addEventListener").mockImplementation(() => ({ remove: jest.fn() }));
		mockGetInstalledBanks.mockReset();
		mockGetSources.mockReset();
		mockAddSource.mockReset();
		mockRemoveSource.mockReset();
		mockGetInstalledBanks.mockResolvedValue([interbank, yape, bcp]);
		mockGetSources.mockResolvedValue([customId]);
		mockAddSource.mockResolvedValue("added");
		mockRemoveSource.mockResolvedValue(true);
	});

	afterEach(() => {
		rendered?.unmount();
		rendered = null;
		jest.restoreAllMocks();
	});

	it("lists installed banks first and toggles a source", async () => {
		const { view, onClose } = await openScreen();
		expect(view.getAllByRole("checkbox").map((node) => node.props.accessibilityLabel)).toEqual([
			yape.name,
			bcp.name,
			"Otra app",
			interbank.name,
		]);
		expect(
			view.getByRole("checkbox", { name: interbank.name }).props.accessibilityState.disabled,
		).toBe(true);
		expect(view.getByText("3 ENCONTRADAS")).toBeTruthy();

		mockAddSource.mockResolvedValueOnce("limit_reached");
		await act(async () => {
			fireEvent.press(view.getByRole("checkbox", { name: bcp.name }));
		});
		expect(mockAddSource).toHaveBeenCalledWith(bcp.packageId);
		expect(
			view.getByText("Llegaste al límite de bancos. Quita uno para agregar otro."),
		).toBeTruthy();

		await act(async () => {
			fireEvent.press(view.getByRole("checkbox", { name: yape.name }));
		});
		expect(
			view.queryByText("Llegaste al límite de bancos. Quita uno para agregar otro."),
		).toBeNull();
		expect(view.getByRole("checkbox", { name: yape.name }).props.accessibilityState.checked).toBe(
			true,
		);

		await act(async () => {
			fireEvent.press(view.getByRole("checkbox", { name: "Otra app" }));
		});
		expect(mockRemoveSource).toHaveBeenCalledWith(customId);
		expect(view.getByText("2 ENCONTRADAS")).toBeTruthy();

		await act(async () => {
			fireEvent.press(view.getByRole("checkbox", { name: interbank.name }));
		});
		expect(mockAddSource).not.toHaveBeenCalledWith(interbank.packageId);

		await act(async () => {
			fireEvent.press(view.getByRole("button", { name: "Volver" }));
		});
		expect(onClose).toHaveBeenCalledTimes(1);
	});

	it("keeps an uninstalled selected bank removable", async () => {
		mockGetSources.mockResolvedValue([interbank.packageId, customId]);
		const { view } = await openScreen();
		const parked = view.getByRole("checkbox", { name: interbank.name });
		expect(parked.props.accessibilityState).toEqual({ checked: true, disabled: false });
		expect(view.getByText("NO INSTALADO")).toBeTruthy();

		await act(async () => {
			fireEvent.press(parked);
		});
		expect(mockRemoveSource).toHaveBeenCalledWith(interbank.packageId);
		expect(
			view.getByRole("checkbox", { name: interbank.name }).props.accessibilityState.disabled,
		).toBe(true);
	});
});
