import { render } from "@testing-library/react-native";
import { ListRow } from "@/shared/components/list-row";

describe("ListRow", () => {
	it("pone testID en la fila que se puede tocar", async () => {
		const view = await render(
			<ListRow label="Sobres" testID="plan-row-sobres" onPress={() => undefined} />,
		);
		expect(view.getByTestId("plan-row-sobres").props.accessibilityLabel).toBe("Sobres");
	});
});
