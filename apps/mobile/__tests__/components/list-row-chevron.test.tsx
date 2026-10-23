import { render } from "@testing-library/react-native";
import { ListRow } from "@/shared/components/list-row";

jest.mock("@/shared/components/ui/reicon", () => {
	const { Text } = require("react-native");
	return {
		ChevronRight: ({ size }: { size?: number }) => <Text>{`chevron:${size ?? "?"}`}</Text>,
		ArrowUpRight: ({ size }: { size?: number }) => <Text>{`external:${size ?? "?"}`}</Text>,
	};
});

describe("ListRow trailing icons", () => {
	it("usa chevron compacto, no el tamaño por defecto de 24", async () => {
		const view = await render(<ListRow label="Seguridad y Passkeys" onPress={() => undefined} />);
		expect(view.getByText("chevron:14")).toBeTruthy();
	});

	it("usa flecha externa compacta", async () => {
		const view = await render(
			<ListRow label="Política de privacidad" external onPress={() => undefined} />,
		);
		expect(view.getByText("external:14")).toBeTruthy();
	});
});
