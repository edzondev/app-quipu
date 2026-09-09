import { act, fireEvent, render, screen } from "@testing-library/react-native";
import type { ComponentProps } from "react";
import { IncomeScreen } from "@/modules/register/income-screen";

jest.mock("@/shared/components/ui/reicon", () => {
  const { View } = require("react-native");
  return {
    ChevronLeft: () => <View testID="icon-back" />,
  };
});

const onBack = jest.fn();
const onSubmit = jest.fn();

const WEIGHTS = {
  allocationNeeds: 50,
  allocationWants: 30,
  allocationSavings: 20,
};

async function renderIncome(
  props: Partial<ComponentProps<typeof IncomeScreen>> = {},
) {
  return render(
    <IncomeScreen
      weights={WEIGHTS}
      commitmentsRemainingCents={126_500}
      onBack={onBack}
      onSubmit={onSubmit}
      {...props}
    />,
  );
}

async function tap(labelOrId: string) {
  await act(async () => {
    const byId = screen.queryByTestId(labelOrId);
    fireEvent.press(byId ?? screen.getByText(labelOrId));
  });
}

describe("IncomeScreen", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("muestra el chrome habitual y el aviso de compromisos", async () => {
    await renderIncome();
    expect(screen.getByText("REGISTRAR INGRESO")).toBeTruthy();
    expect(screen.getByText("Habitual")).toBeTruthy();
    expect(screen.getByText("Extraordinario")).toBeTruthy();
    expect(screen.getByText("Sueldo")).toBeTruthy();
    expect(screen.getByText("Proyecto")).toBeTruthy();
    expect(screen.getByText("Negocio")).toBeTruthy();
    expect(screen.getByText("Devolución")).toBeTruthy();
    expect(screen.getByText("CÓMO SE REPARTE")).toBeTruthy();
    expect(
      screen.getByText(
        "Tus compromisos del ciclo (S/ 1,265) salen de Necesidades.",
      ),
    ).toBeTruthy();
    expect(screen.queryByText("Ajustar")).toBeNull();
  });

  it("al escribir 3500 reparte 50/30/20", async () => {
    await renderIncome();
    await act(async () => {
      fireEvent.changeText(screen.getByTestId("income-amount"), "3500");
    });
    expect(screen.getByText("S/ 1,750")).toBeTruthy();
    expect(screen.getByText("S/ 1,050")).toBeTruthy();
    expect(screen.getByText("S/ 700")).toBeTruthy();
  });

  it("registra un habitual de sueldo", async () => {
    await renderIncome();
    await act(async () => {
      fireEvent.changeText(screen.getByTestId("income-amount"), "3500");
    });
    await tap("submit-income");
    expect(onSubmit).toHaveBeenCalledWith(
      expect.objectContaining({
        amount: 350_000,
        source: "payroll",
        description: "Sueldo",
        incomeKind: "habitual",
        allocation: expect.objectContaining({
          envelopes: { needs: 175_000, wants: 105_000, savings: 70_000 },
        }),
      }),
    );
  });

  it("sin monto no envía y lo dice", async () => {
    await renderIncome();
    await tap("submit-income");
    expect(onSubmit).not.toHaveBeenCalled();
    expect(screen.getByText("Escribe el monto recibido.")).toBeTruthy();
  });

  it("extraordinario CTS manda todo al ahorro", async () => {
    await renderIncome();
    await tap("Extraordinario");
    await tap("CTS");
    await act(async () => {
      fireEvent.changeText(screen.getByTestId("income-amount"), "2000");
    });
    expect(screen.getByText("S/ 2,000")).toBeTruthy();
    await tap("submit-income");
    expect(onSubmit).toHaveBeenCalledWith(
      expect.objectContaining({
        incomeKind: "extraordinary",
        extraordinaryType: "cts",
        distributionPolicy: "all_to_savings",
        allocation: expect.objectContaining({
          envelopes: { needs: 0, wants: 0, savings: 200_000 },
        }),
      }),
    );
  });

  it("si hay que preguntar, deja elegir destino", async () => {
    await renderIncome({
      extraordinaryRules: { corporate_bonus: "ask_each_time" },
    });
    await tap("Extraordinario");
    await tap("Bono empresarial");
    expect(screen.getByText("Mi distribución")).toBeTruthy();
    expect(screen.getByText("Todo al ahorro")).toBeTruthy();
    await act(async () => {
      fireEvent.changeText(screen.getByTestId("income-amount"), "500");
    });
    await tap("Todo al ahorro");
    await tap("submit-income");
    expect(onSubmit).toHaveBeenCalledWith(
      expect.objectContaining({
        extraordinaryType: "corporate_bonus",
        distributionPolicy: "all_to_savings",
      }),
    );
  });
});
