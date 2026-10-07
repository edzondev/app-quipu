import { act, cleanup, fireEvent, render } from "@testing-library/react-native";
import { ExpenseForm } from "@/shared/components/expenses/expense-form";

type PressableInstance = Parameters<typeof fireEvent.press>[0];
type TextInputInstance = Parameters<typeof fireEvent.changeText>[0];

async function changeText(instance: TextInputInstance, value: string) {
  await act(async () => {
    fireEvent.changeText(instance, value);
  });
}

async function press(instance: PressableInstance) {
  await act(async () => {
    fireEvent.press(instance);
  });
}

describe("ExpenseForm", () => {
  afterEach(() => {
    cleanup();
  });

  it("envía monto, descripción y sobre de gustos", async () => {
    const onSubmit = jest.fn();
    const view = await render(
      <ExpenseForm submitLabel="Guardar" onSubmit={onSubmit} />,
    );

    await changeText(view.getByPlaceholderText("0.00"), "15,50");
    await changeText(view.getByPlaceholderText("Descripción"), "Menú del día");
    await press(view.getByText("Gustos"));
    await press(view.getByText("Guardar"));

    expect(onSubmit).toHaveBeenCalledWith({
      amountRaw: "15,50",
      description: "Menú del día",
      envelopeType: "wants",
    });
    expect(view.queryByText("Ahorro")).toBeNull();
  });

  it("precarga un gasto existente para editarlo", async () => {
    const onSubmit = jest.fn();
    const view = await render(
      <ExpenseForm
        submitLabel="Actualizar"
        initial={{
          amountCents: 1550,
          description: "Café",
          envelopeType: "wants",
        }}
        onSubmit={onSubmit}
      />,
    );
    await press(view.getByText("Actualizar"));
    expect(onSubmit).toHaveBeenCalledWith({
      amountRaw: "15.50",
      description: "Café",
      envelopeType: "wants",
    });
  });

  it("muestra el error del campo y permite eliminar", async () => {
    const onDelete = jest.fn();
    const view = await render(
      <ExpenseForm
        submitLabel="Actualizar"
        fieldError={{
          field: "amount",
          message: "Ingresa un monto mayor a cero.",
        }}
        onSubmit={jest.fn()}
        onDelete={onDelete}
      />,
    );
    expect(view.getByText("Ingresa un monto mayor a cero.")).toBeTruthy();
    await press(view.getByText("Eliminar"));
    expect(onDelete).toHaveBeenCalledTimes(1);
  });
});
