import { render } from "@testing-library/react-native";
import { EnvelopeCarryLine } from "@/shared/components/envelope-carry-line";

describe("EnvelopeCarryLine", () => {
	it("pone testID en la línea de arrastre", async () => {
		const view = await render(
			<EnvelopeCarryLine label="Saldo que quedó S/ 120" testID="home-carry" />,
		);
		expect(view.getByTestId("home-carry").props.children).toBe("Saldo que quedó S/ 120");
	});
});
