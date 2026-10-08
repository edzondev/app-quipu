import { cleanup, fireEvent, render } from "@testing-library/react-native";
import { ProgressBody } from "@/shared/components/savings/progress-body";

describe("ProgressBody", () => {
	afterEach(() => {
		cleanup();
	});

	it("lleva a ahorro y metas", async () => {
		const onOpenAhorro = jest.fn();
		const view = await render(<ProgressBody onOpenAhorro={onOpenAhorro} />);

		expect(view.getByText("Tu avance vive en Ahorro.")).toBeTruthy();
		expect(
			view.getByText(
				"El fondo y las metas se ven desde Plan, hasta que esta pestaña tenga su propia vista.",
			),
		).toBeTruthy();

		await fireEvent.press(view.getByLabelText("Ver ahorro y metas"));
		expect(onOpenAhorro).toHaveBeenCalledTimes(1);
	});
});
