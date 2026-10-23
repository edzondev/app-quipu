import { act, cleanup, fireEvent, render } from "@testing-library/react-native";
import { MovementsList } from "@/shared/components/movements/movements-list";

jest.mock("@/shared/components/ui/reicon", () => {
	const { Text } = require("react-native");
	return {
		Search: ({ size }: { size?: number }) => <Text>{`icon:search:${size ?? "?"}`}</Text>,
		X: ({ size }: { size?: number }) => <Text>{`icon:x:${size ?? "?"}`}</Text>,
	};
});

const empty = {
	currencyCode: "PEN",
	cycle: {
		startDate: Date.parse("2026-08-01T00:00:00-05:00"),
		endDate: Date.parse("2026-08-31T00:00:00-05:00"),
	},
	movements: [],
};

describe("MovementsList search toggle icon", () => {
	afterEach(() => {
		cleanup();
	});

	it("pasa de lupa a X al abrir el buscador", async () => {
		const view = await render(
			<MovementsList status="ready" data={empty} onOpenExpense={jest.fn()} onCreate={jest.fn()} />,
		);

		expect(view.getByText("icon:search:20")).toBeTruthy();
		expect(view.queryByText(/icon:x:/)).toBeNull();

		await act(async () => {
			fireEvent.press(view.getByLabelText("Buscar"));
		});

		expect(view.getByText("icon:x:20")).toBeTruthy();
		expect(view.queryByText(/icon:search:/)).toBeNull();
		expect(view.getByLabelText("Cerrar búsqueda")).toBeTruthy();
	});
});
