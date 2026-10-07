import { act, cleanup, fireEvent, render } from "@testing-library/react-native";
import { SobresScreen } from "@/shared/components/envelopes/sobres-screen";
import type { SobresScreenModel } from "@/shared/lib/dashboard/sobres-model";

const screen: SobresScreenModel = {
  dayLabel: "DÍA 15 / 30",
  envelopes: [
    {
      tone: "needs",
      label: "Necesidades",
      statusLabel: "Al día",
      statusTone: "calm",
      symbol: "S/",
      negative: false,
      amountLabel: "1,138",
      budgetLabel: "de S/ 1,750",
      progress: 35,
      footLeft: "GASTADO S/ 612",
      footRight: "ALQUILER PENDIENTE",
      footRightTone: "calm",
    },
    {
      tone: "wants",
      label: "Gustos",
      statusLabel: "Va rápido",
      statusTone: "fast",
      symbol: "S/",
      negative: false,
      amountLabel: "231",
      budgetLabel: "de S/ 1,050",
      progress: 78,
      footLeft: "GASTADO S/ 819",
      footRight: "ALCANZA 6 DÍAS",
      footRightTone: "fast",
    },
    {
      tone: "savings",
      label: "Ahorro",
      statusLabel: "Intacto",
      statusTone: "calm",
      symbol: "S/",
      negative: false,
      amountLabel: "700",
      budgetLabel: "apartado este ciclo",
      progress: 100,
      footLeft: "FONDO + VIAJE",
      footRight: "100%",
      footRightTone: "calm",
    },
  ],
};

async function press(instance: Parameters<typeof fireEvent.press>[0]) {
  await act(async () => {
    fireEvent.press(instance);
  });
}

describe("SobresScreen", () => {
  afterEach(async () => {
    await cleanup();
  });

  it("muestra barra, ritmo y las dos acciones", async () => {
    const onMoveMoney = jest.fn();
    const onRegisterExpense = jest.fn();
    const view = await render(
      <SobresScreen
        status="ready"
        screen={screen}
        onMoveMoney={onMoveMoney}
        onRegisterExpense={onRegisterExpense}
      />,
    );

    expect(view.getByText("Sobres")).toBeTruthy();
    expect(view.getByText("DÍA 15 / 30")).toBeTruthy();
    expect(
      view.getByText("Tu sueldo ya está dividido. Esto es lo que queda."),
    ).toBeTruthy();
    expect(view.getByText("Necesidades")).toBeTruthy();
    expect(view.getByText("Al día")).toBeTruthy();
    expect(view.getByText("1,138")).toBeTruthy();
    expect(view.getByText("de S/ 1,750")).toBeTruthy();
    expect(view.getByText("GASTADO S/ 612")).toBeTruthy();
    expect(view.getByText("ALQUILER PENDIENTE")).toBeTruthy();
    expect(view.getByText("Va rápido")).toBeTruthy();
    expect(view.getByText("ALCANZA 6 DÍAS")).toBeTruthy();
    expect(view.getByText("Intacto")).toBeTruthy();
    expect(view.getByText("apartado este ciclo")).toBeTruthy();
    expect(view.getByText("FONDO + VIAJE")).toBeTruthy();
    expect(view.getByText("100%")).toBeTruthy();
    expect(view.getByLabelText("Gustos")).toHaveProp("accessibilityValue", {
      min: 0,
      max: 100,
      now: 78,
    });

    await press(view.getByText("Mover dinero"));
    await press(view.getByText("Registrar gasto"));
    expect(onMoveMoney).toHaveBeenCalledTimes(1);
    expect(onRegisterExpense).toHaveBeenCalledTimes(1);
  });

  it("carga y el ciclo vacío no inventan sobres ni acciones", async () => {
    const loading = await render(
      <SobresScreen
        status="loading"
        screen={null}
        onMoveMoney={jest.fn()}
        onRegisterExpense={jest.fn()}
      />,
    );
    expect(loading.getByText("Cargando…")).toBeTruthy();
    expect(loading.queryByText("Mover dinero")).toBeNull();
    await cleanup();

    const empty = await render(
      <SobresScreen
        status="empty"
        screen={null}
        onMoveMoney={jest.fn()}
        onRegisterExpense={jest.fn()}
      />,
    );
    expect(
      empty.getByText("Todavía no hay sobres en el ciclo activo."),
    ).toBeTruthy();
    expect(empty.queryByText("Registrar gasto")).toBeNull();
    expect(empty.queryByText("Necesidades")).toBeNull();
  });
});
