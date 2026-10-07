import { cleanup, fireEvent, render } from "@testing-library/react-native";
import { ExpenseDetailForm } from "@/shared/components/expenses/expense-detail-form";

const AUGUST_15 = Date.UTC(2026, 7, 15, 17, 0, 0);

describe("ExpenseDetailForm", () => {
  afterEach(() => {
    cleanup();
  });

  it("muestra la jerarquía 1f y rellena un frecuente", async () => {
    const onSubmit = jest.fn();
    const view = await render(
      <ExpenseDetailForm
        mode="create"
        currencySymbol="S/"
        dailyCents={4230}
        previousAmountCents={0}
        initial={{
          amountRaw: "42.00",
          description: "Plaza Vea",
          envelopeType: "wants",
        }}
        timestamp={AUGUST_15}
        frecuentes={[
          { id: "m1", label: "Metropolitano", amountCents: 500 },
          { id: "c1", label: "Café", amountCents: 800 },
        ]}
        onSubmit={onSubmit}
        onBack={jest.fn()}
      />,
    );

    expect(view.getByText("REGISTRAR GASTO")).toBeTruthy();
    expect(view.getByLabelText("Monto").props.value).toBe("42.00");
    expect(view.getByText("HOY QUEDARÍA S/ 0.30")).toBeTruthy();
    expect(view.getByText("Comercio")).toBeTruthy();
    expect(view.getByText("Sobre")).toBeTruthy();
    expect(view.getByText("Gustos")).toBeTruthy();
    expect(view.getByText("Fecha")).toBeTruthy();
    expect(view.getByText("15 ago")).toBeTruthy();
    expect(view.getByText("Nota")).toBeTruthy();
    expect(view.getByText("Opcional")).toBeTruthy();
    expect(view.getByText("Adjuntar boleta")).toBeTruthy();
    expect(view.getByText("OCR")).toBeTruthy();
    expect(view.getByText("FRECUENTES")).toBeTruthy();

    await fireEvent.press(view.getByText("Café · 8"));
    await fireEvent.press(view.getByText("Registrar gasto"));
    expect(onSubmit).toHaveBeenCalledWith({
      amountRaw: "8.00",
      description: "Café",
      envelopeType: "wants",
    });
  });

  it("edita el sobre y permite eliminar", async () => {
    const onSubmit = jest.fn();
    const onDelete = jest.fn();
    const view = await render(
      <ExpenseDetailForm
        mode="edit"
        currencySymbol="S/"
        dailyCents={4230}
        previousAmountCents={4200}
        initial={{
          amountRaw: "42.00",
          description: "Plaza Vea",
          envelopeType: "wants",
        }}
        timestamp={AUGUST_15}
        frecuentes={[]}
        onSubmit={onSubmit}
        onBack={jest.fn()}
        onDelete={onDelete}
      />,
    );

    expect(view.getByText("EDITAR GASTO")).toBeTruthy();
    expect(view.queryByText("Id de sobre")).toBeNull();
    expect(view.queryByText("env_wants")).toBeNull();
    expect(view.getByText("HOY QUEDARÍA S/ 42.30")).toBeTruthy();
    expect(view.queryByText("FRECUENTES")).toBeNull();

    await fireEvent.press(view.getByLabelText("Cambiar sobre"));
    await fireEvent.press(view.getByText("Necesidades"));
    await fireEvent.press(view.getByText("Guardar"));
    expect(onSubmit).toHaveBeenCalledWith({
      amountRaw: "42.00",
      description: "Plaza Vea",
      envelopeType: "needs",
    });

    await fireEvent.press(view.getByText("Eliminar"));
    expect(onDelete).toHaveBeenCalledTimes(1);
  });
});
