import { cleanup, fireEvent, render } from "@testing-library/react-native";
import { ExpenseSheetForm } from "@/shared/components/expenses/expense-sheet-form";

describe("ExpenseSheetForm", () => {
  afterEach(() => {
    cleanup();
  });

  it("arma monto, comercio y sobre con el keypad", async () => {
    const onSubmit = jest.fn();
    const view = await render(
      <ExpenseSheetForm
        currencySymbol="S/"
        dailyCents={4230}
        onSubmit={onSubmit}
        onCancel={jest.fn()}
        onOpenDetail={jest.fn()}
      />,
    );

    await fireEvent.press(view.getByText("4"));
    await fireEvent.press(view.getByText("2"));
    await fireEvent.press(view.getByLabelText(","));
    await fireEvent.press(view.getByText("0"));
    await fireEvent.press(view.getByText("0"));
    expect(view.getByLabelText("Monto").props.children).toBe("42.00");
    expect(
      view.getByText("DESPUÉS DE ESTE GASTO · HOY QUEDA S/ 0.30"),
    ).toBeTruthy();

    await fireEvent.changeText(view.getByLabelText("Comercio"), "Plaza Vea");
    await fireEvent.press(view.getByText("Gustos"));
    await fireEvent.press(view.getByText("Registrar gasto"));

    expect(onSubmit).toHaveBeenCalledWith({
      amountRaw: "42.00",
      description: "Plaza Vea",
      envelopeType: "wants",
    });
  });

  it("borra un dígito y abre el detalle con el borrador", async () => {
    const onOpenDetail = jest.fn();
    const view = await render(
      <ExpenseSheetForm
        currencySymbol="S/"
        dailyCents={null}
        onSubmit={jest.fn()}
        onCancel={jest.fn()}
        onOpenDetail={onOpenDetail}
      />,
    );

    await fireEvent.press(view.getByText("1"));
    await fireEvent.press(view.getByText("5"));
    await fireEvent.press(view.getByLabelText("Borrar"));
    await fireEvent.press(view.getByText("Ahorro"));
    await fireEvent.press(view.getByLabelText("Abrir detalle del gasto"));

    expect(view.queryByText(/HOY QUEDA/)).toBeNull();
    expect(onOpenDetail).toHaveBeenCalledWith({
      amountRaw: "0.01",
      description: "",
      envelopeType: "savings",
    });
  });

  it("muestra el error del campo", async () => {
    const view = await render(
      <ExpenseSheetForm
        currencySymbol="S/"
        dailyCents={100}
        fieldError={{
          field: "amount",
          message: "Ingresa un monto mayor a cero.",
        }}
        onSubmit={jest.fn()}
        onCancel={jest.fn()}
        onOpenDetail={jest.fn()}
      />,
    );
    expect(view.getByText("Ingresa un monto mayor a cero.")).toBeTruthy();
  });
});
