import { act, fireEvent, render, screen } from "@testing-library/react-native";
import type { ComponentProps } from "react";
import { ExpenseSheet } from "@/modules/register/expense-sheet";

jest.mock("@/shared/components/ui/reicon", () => {
  const { View } = require("react-native");
  return {
    Camera: () => <View testID="icon-camera" />,
    Backspace: () => <View testID="icon-backspace" />,
  };
});

const onCancel = jest.fn();
const onSubmit = jest.fn();
const onIncome = jest.fn();

async function renderSheet(
  props: Partial<ComponentProps<typeof ExpenseSheet>> = {},
) {
  return render(
    <ExpenseSheet
      todayCents={4230}
      onCancel={onCancel}
      onSubmit={onSubmit}
      onIncome={onIncome}
      {...props}
    />,
  );
}

async function tap(testId: string) {
  await act(async () => {
    fireEvent.press(screen.getByTestId(testId));
  });
}

async function typeAmount(digits: string) {
  for (const digit of digits) {
    await tap(`keypad-${digit}`);
  }
}

describe("ExpenseSheet", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("muestra el chrome del gasto y no el pill de Ahorro", async () => {
    await renderSheet();
    expect(screen.getByText("NUEVO GASTO")).toBeTruthy();
    expect(screen.getByText("Cancelar")).toBeTruthy();
    expect(screen.getByText("Registrar gasto")).toBeTruthy();
    expect(screen.getByText("Necesidades")).toBeTruthy();
    expect(screen.getByText("Gustos")).toBeTruthy();
    expect(screen.queryByText("Ahorro")).toBeNull();
    expect(screen.getByTestId("icon-camera")).toBeTruthy();
  });

  it("el teclado arma 42.00 y actualiza lo que queda hoy", async () => {
    await renderSheet();
    await typeAmount("4200");
    expect(screen.getByTestId("expense-int")).toBeTruthy();
    expect(screen.getByText("42")).toBeTruthy();
    expect(screen.getByText(".00")).toBeTruthy();
    expect(
      screen.getByText("DESPUÉS DE ESTE GASTO · HOY QUEDA S/ 0.30"),
    ).toBeTruthy();
  });

  it("2550 es 25 soles con 50 céntimos", async () => {
    await renderSheet();
    await typeAmount("2550");
    expect(screen.getByText("25")).toBeTruthy();
    expect(screen.getByText(".50")).toBeTruthy();
    expect(
      screen.getByText("DESPUÉS DE ESTE GASTO · HOY QUEDA S/ 16.80"),
    ).toBeTruthy();
  });

  it("registra en Gustos por defecto", async () => {
    await renderSheet();
    await typeAmount("4200");
    await act(async () => {
      fireEvent.changeText(screen.getByTestId("merchant-input"), "Plaza Vea");
    });
    await tap("submit-expense");
    expect(onSubmit).toHaveBeenCalledWith({
      amountCents: 4200,
      description: "Plaza Vea",
      envelopeType: "wants",
    });
  });

  it("puede cambiar el sobre a Necesidades", async () => {
    await renderSheet();
    await typeAmount("100");
    await tap("envelope-needs");
    await tap("submit-expense");
    expect(onSubmit).toHaveBeenCalledWith(
      expect.objectContaining({ envelopeType: "needs", amountCents: 100 }),
    );
  });

  it("sin monto, Continuar no envía y pide el dato", async () => {
    await renderSheet();
    await tap("submit-expense");
    expect(onSubmit).not.toHaveBeenCalled();
    expect(screen.getByText("Escribe el monto del gasto.")).toBeTruthy();
  });

  it("sin ciclo activo no envía y lo dice", async () => {
    await renderSheet({ todayCents: null });
    await tap("keypad-4");
    await tap("submit-expense");
    expect(onSubmit).not.toHaveBeenCalled();
    expect(
      screen.getByText("Primero registra un ingreso para abrir el ciclo."),
    ).toBeTruthy();
  });

  it("Es un ingreso abre la pantalla de ingreso", async () => {
    await renderSheet();
    await tap("expense-to-income");
    expect(onIncome).toHaveBeenCalled();
  });
});
