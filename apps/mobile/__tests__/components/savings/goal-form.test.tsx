import { cleanup, fireEvent, render } from "@testing-library/react-native";
import { GoalForm } from "@/shared/components/savings/goal-form";

describe("GoalForm", () => {
	afterEach(() => {
		cleanup();
	});

	it("crea la meta sin monto", async () => {
		const onSubmit = jest.fn().mockResolvedValue(undefined);
		const view = await render(<GoalForm onSubmit={onSubmit} onCancel={jest.fn()} />);

		await fireEvent.changeText(view.getByLabelText("Nombre de la meta"), "  Viaje  ");
		await fireEvent.press(view.getByLabelText("Crear meta"));

		expect(onSubmit).toHaveBeenCalledWith({ label: "Viaje" });
	});

	it("crea la meta con monto en céntimos", async () => {
		const onSubmit = jest.fn().mockResolvedValue(undefined);
		const view = await render(<GoalForm onSubmit={onSubmit} onCancel={jest.fn()} />);

		await fireEvent.changeText(view.getByLabelText("Nombre de la meta"), "Viaje");
		await fireEvent.changeText(view.getByLabelText("Meta"), "2000");
		await fireEvent.press(view.getByLabelText("Crear meta"));

		expect(onSubmit).toHaveBeenCalledWith({ label: "Viaje", targetAmount: 200000 });
	});

	it("muestra el error de monto y no envía", async () => {
		const onSubmit = jest.fn();
		const view = await render(<GoalForm onSubmit={onSubmit} onCancel={jest.fn()} />);

		await fireEvent.changeText(view.getByLabelText("Nombre de la meta"), "Viaje");
		await fireEvent.changeText(view.getByLabelText("Meta"), "0");
		await fireEvent.press(view.getByLabelText("Crear meta"));

		expect(onSubmit).not.toHaveBeenCalled();
		expect(view.getByText("La meta debe ser mayor a cero.")).toBeTruthy();
	});

	it("muestra el error del servidor si la meta ya existe", async () => {
		const onSubmit = jest.fn().mockRejectedValue({
			data: {
				code: "ALREADY_EXISTS",
				message: "Ya tienes una meta con ese nombre.",
			},
		});
		const view = await render(<GoalForm onSubmit={onSubmit} onCancel={jest.fn()} />);

		await fireEvent.changeText(view.getByLabelText("Nombre de la meta"), "Viaje");
		await fireEvent.press(view.getByTestId("goal-submit"));

		expect(await view.findByText("Ya tienes una meta con ese nombre.")).toBeTruthy();
		expect(onSubmit).toHaveBeenCalledWith({ label: "Viaje" });
	});

	it("cancela", async () => {
		const onCancel = jest.fn();
		const view = await render(<GoalForm onSubmit={jest.fn()} onCancel={onCancel} />);
		await fireEvent.press(view.getByLabelText("Cancelar"));
		expect(onCancel).toHaveBeenCalledTimes(1);
	});
});
