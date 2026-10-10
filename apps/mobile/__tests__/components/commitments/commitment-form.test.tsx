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

	it("avisa al escribir si el día no existe y muestra el próximo vencimiento", async () => {
		const view = await render(<CommitmentForm onSubmit={jest.fn()} onCancel={jest.fn()} />);
		const dayInput = view.getByLabelText("Día de vencimiento");

		expect(view.getByText("Se repite cada mes.")).toBeTruthy();

		await fireEvent.changeText(dayInput, "64");
		expect(view.getByText("El día de vencimiento va del 1 al 31.")).toBeTruthy();

		await fireEvent.changeText(dayInput, "21");
		expect(view.queryByText("El día de vencimiento va del 1 al 31.")).toBeNull();
		expect(view.getByText(/^Se repite cada mes\. Próximo: 21 [A-Z]{3}\.$/)).toBeTruthy();
	});

	it("muestra el error del servidor si no se pudo guardar", async () => {
		const onSubmit = jest.fn().mockRejectedValue({
			data: {
				code: "VALIDATION_ERROR",
				message: "El monto debe ser un entero de céntimos mayor a cero.",
			},
		});
		const view = await render(<CommitmentForm onSubmit={onSubmit} onCancel={jest.fn()} />);

		await fireEvent.changeText(view.getByLabelText("Nombre"), "Luz");
		await fireEvent.changeText(view.getByLabelText("Monto"), "10");
		await fireEvent.changeText(view.getByLabelText("Día de vencimiento"), "5");
		await fireEvent.press(view.getByLabelText("Agregar compromiso"));

		expect(
			await view.findByText("El monto debe ser un entero de céntimos mayor a cero."),
		).toBeTruthy();
		expect(onSubmit).toHaveBeenCalledWith({
			name: "Luz",
			amount: 1000,
			dueDay: 5,
			envelope: "needs",
		});
	});

	it("cancela", async () => {
		const onCancel = jest.fn();
		const view = await render(<CommitmentForm onSubmit={jest.fn()} onCancel={onCancel} />);
		await fireEvent.press(view.getByLabelText("Cancelar"));
		expect(onCancel).toHaveBeenCalledTimes(1);
	});
});
