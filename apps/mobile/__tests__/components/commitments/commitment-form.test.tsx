import { cleanup, fireEvent, render } from "@testing-library/react-native";
import { CommitmentForm } from "@/shared/components/commitments/commitment-form";

describe("CommitmentForm", () => {
	afterEach(() => {
		cleanup();
	});

	it("envía nombre, monto, día y sobre sin ofrecer Ahorro", async () => {
		const onSubmit = jest.fn();
		const view = await render(<CommitmentForm onSubmit={onSubmit} onCancel={jest.fn()} />);

		expect(view.queryByText("Ahorro")).toBeNull();
		await fireEvent.press(view.getByText("+ Agua"));
		await fireEvent.changeText(view.getByLabelText("Monto"), "96");
		await fireEvent.changeText(view.getByLabelText("Día de vencimiento"), "22");
		await fireEvent.press(view.getByText("Gustos"));
		await fireEvent.press(view.getByLabelText("Agregar compromiso"));

		expect(onSubmit).toHaveBeenCalledWith({
			name: "Agua",
			amount: 9600,
			dueDay: 22,
			envelope: "wants",
		});
	});

	it("muestra el error de monto y no envía", async () => {
		const onSubmit = jest.fn();
		const view = await render(<CommitmentForm onSubmit={onSubmit} onCancel={jest.fn()} />);

		await fireEvent.changeText(view.getByLabelText("Nombre"), "Luz");
		await fireEvent.changeText(view.getByLabelText("Monto"), "0");
		await fireEvent.changeText(view.getByLabelText("Día de vencimiento"), "5");
		await fireEvent.press(view.getByLabelText("Agregar compromiso"));

		expect(onSubmit).not.toHaveBeenCalled();
		expect(view.getByText("El monto debe ser mayor a cero.")).toBeTruthy();
	});

	it("no llama al submit si el día no existe", async () => {
		const onSubmit = jest.fn();
		const view = await render(<CommitmentForm onSubmit={onSubmit} onCancel={jest.fn()} />);

		await fireEvent.changeText(view.getByLabelText("Nombre"), "Luz");
		await fireEvent.changeText(view.getByLabelText("Monto"), "10");
		await fireEvent.changeText(view.getByLabelText("Día de vencimiento"), "32");
		await fireEvent.press(view.getByLabelText("Agregar compromiso"));

		expect(onSubmit).not.toHaveBeenCalled();
		expect(view.getByText("El día de vencimiento va del 1 al 31.")).toBeTruthy();
	});

	it("cancela", async () => {
		const onCancel = jest.fn();
		const view = await render(<CommitmentForm onSubmit={jest.fn()} onCancel={onCancel} />);
		await fireEvent.press(view.getByLabelText("Cancelar"));
		expect(onCancel).toHaveBeenCalledTimes(1);
	});
});
