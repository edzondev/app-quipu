import { act, fireEvent, render, screen } from "@testing-library/react-native";
import { useEffect } from "react";
import { Text, TextInput } from "react-native";
import { Step4Commitments } from "@/modules/onboarding/components/step-4-commitments";
import {
  OnboardingProvider,
  useOnboarding,
} from "@/modules/onboarding/onboarding-provider";
import type { DraftCommitment } from "@/shared/lib/onboarding/types";

const mockBack = jest.fn();
const mockReplace = jest.fn();

jest.mock("expo-router", () => ({
  useRouter: () => ({
    back: mockBack,
    canGoBack: () => true,
    replace: mockReplace,
  }),
}));

jest.mock("@/shared/components/ui/reicon", () => {
  const { View } = require("react-native");
  return {
    Check: () => <View testID="icon-check" />,
    ChevronLeft: () => <View testID="icon-back" />,
    X: () => <View testID="icon-x" />,
  };
});

function SeedState() {
  const { dispatch } = useOnboarding();
  useEffect(() => {
    dispatch({ type: "SET_STEP", payload: 4 });
  }, [dispatch]);
  return null;
}

function StateProbe() {
  const { state } = useOnboarding();
  return (
    <>
      <Text testID="probe-step">{String(state.step)}</Text>
      <Text testID="probe-commitments">
        {JSON.stringify(state.commitments)}
      </Text>
    </>
  );
}

function getCommitments(): DraftCommitment[] {
  return JSON.parse(
    screen.getByTestId("probe-commitments").props.children,
  ) as DraftCommitment[];
}

async function renderStep4() {
  return render(
    <OnboardingProvider>
      <SeedState />
      <StateProbe />
      <Step4Commitments />
    </OnboardingProvider>,
  );
}

async function pressChip(name: string) {
  await act(async () => {
    fireEvent.press(screen.getByTestId(`chip-${name.toLowerCase()}`));
  });
}

describe("Step4Commitments — compromisos", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("muestra el header del paso 04, los chips y el total", async () => {
    await renderStep4();
    expect(screen.getByText("TU SISTEMA · 04/04")).toBeTruthy();
    expect(screen.getByText("¿Qué pagas todos los meses?")).toBeTruthy();
    expect(
      screen.getByText(
        "Los reservamos de Necesidades para que nunca aparezcan como sorpresa.",
      ),
    ).toBeTruthy();
    expect(screen.getByTestId("chip-agua")).toBeTruthy();
    expect(screen.getByTestId("chip-celular")).toBeTruthy();
    expect(screen.getByTestId("chip-gimnasio")).toBeTruthy();
    expect(screen.getByTestId("chip-streaming")).toBeTruthy();
    expect(screen.getByTestId("chip-otro")).toBeTruthy();
    expect(screen.getByText("Se reserva de Necesidades")).toBeTruthy();
    expect(screen.getByText("S/ 0")).toBeTruthy();
  });

  it("tocar el chip '+ Agua' agrega una fila con nombre Agua vacía", async () => {
    await renderStep4();
    await pressChip("Agua");
    expect(getCommitments()).toHaveLength(1);
    expect(screen.getByTestId("commitment-name-0").props.value).toBe("Agua");
    expect(screen.getByTestId("commitment-amount-0").props.value).toBe("");
    expect(screen.getByTestId("commitment-day-0").props.value).toBe("");
    expect(screen.getByText("S/ 0")).toBeTruthy();
  });

  it("tras agregar Agua, el chip Agua queda deshabilitado y no duplica", async () => {
    await renderStep4();
    await pressChip("Agua");
    expect(getCommitments()).toHaveLength(1);
    expect(
      screen.getByTestId("chip-agua").props.accessibilityState.disabled,
    ).toBe(true);
    await pressChip("Agua");
    expect(getCommitments()).toHaveLength(1);
  });

  it("Otro se puede agregar más de una vez y el chip sigue activo", async () => {
    await renderStep4();
    await pressChip("Otro");
    await pressChip("Otro");
    expect(getCommitments()).toHaveLength(2);
    expect(
      screen.getByTestId("chip-otro").props.accessibilityState?.disabled,
    ).not.toBe(true);
  });

  it("eliminar la fila de Agua rehabilita el chip", async () => {
    await renderStep4();
    await pressChip("Agua");
    await act(async () => {
      fireEvent.press(screen.getByTestId("remove-commitment-0"));
    });
    expect(
      screen.getByTestId("chip-agua").props.accessibilityState?.disabled,
    ).not.toBe(true);
    await pressChip("Agua");
    expect(getCommitments()).toHaveLength(1);
  });

  it("el día vacío muestra placeholder 1–31", async () => {
    await renderStep4();
    await pressChip("Agua");
    expect(screen.getByTestId("commitment-day-0").props.placeholder).toBe(
      "1–31",
    );
  });

  it("el día anuncia Día del mes, del 1 al 31", async () => {
    await renderStep4();
    await pressChip("Agua");
    expect(
      screen.getByTestId("commitment-day-0").props.accessibilityLabel,
    ).toBe("Día del mes, del 1 al 31");
  });

  it("el campo del día lleva subrayado", async () => {
    await renderStep4();
    await pressChip("Agua");
    const field = screen.getByTestId("commitment-day-field-0");
    expect(field.props.className).toContain("border-b");
    expect(field.props.className).toContain("border-line");
  });

  it("tocar CADA DÍA enfoca el input del día", async () => {
    const focusSpy = jest.spyOn(TextInput.prototype, "focus");
    await renderStep4();
    await pressChip("Agua");
    focusSpy.mockClear();
    await act(async () => {
      fireEvent.press(screen.getByTestId("commitment-day-label-0"));
    });
    expect(focusSpy).toHaveBeenCalled();
    focusSpy.mockRestore();
  });

  it("editar monto 1100 guarda amountCents 110000 y día 5 guarda dueDay 5", async () => {
    await renderStep4();
    await pressChip("Agua");
    await act(async () => {
      fireEvent.changeText(screen.getByTestId("commitment-amount-0"), "1100");
    });
    expect(getCommitments()[0].amountCents).toBe(110000);
    await act(async () => {
      fireEvent.changeText(screen.getByTestId("commitment-day-0"), "5");
    });
    expect(getCommitments()[0].dueDay).toBe(5);
    expect(getCommitments()[0].name).toBe("Agua");
    expect(screen.getByText("S/ 1,100")).toBeTruthy();
  });

  it("39.99 guarda 3999 céntimos y se ve 39.99", async () => {
    await renderStep4();
    await pressChip("Celular");
    await act(async () => {
      fireEvent.changeText(screen.getByTestId("commitment-amount-0"), "39.99");
    });
    expect(getCommitments()[0].amountCents).toBe(3999);
    expect(screen.getByTestId("commitment-amount-0").props.value).toBe("39.99");
  });

  it("39,99 también guarda 3999 céntimos", async () => {
    await renderStep4();
    await pressChip("Celular");
    await act(async () => {
      fireEvent.changeText(screen.getByTestId("commitment-amount-0"), "39,99");
    });
    expect(getCommitments()[0].amountCents).toBe(3999);
    expect(screen.getByTestId("commitment-amount-0").props.value).toBe("39.99");
  });

  it("editar el nombre actualiza el compromiso en estado", async () => {
    await renderStep4();
    await pressChip("Otro");
    await act(async () => {
      fireEvent.changeText(
        screen.getByTestId("commitment-name-0"),
        "Seguro de vida",
      );
    });
    expect(getCommitments()[0].name).toBe("Seguro de vida");
  });

  it("el icono X elimina la fila", async () => {
    await renderStep4();
    await pressChip("Agua");
    await pressChip("Celular");
    expect(getCommitments()).toHaveLength(2);
    await act(async () => {
      fireEvent.press(screen.getByTestId("remove-commitment-0"));
    });
    expect(getCommitments()).toHaveLength(1);
    expect(getCommitments()[0].name).toBe("Celular");
    expect(screen.queryByTestId("commitment-row-1")).toBeNull();
  });

  it("suma solo filas válidas: Se reserva de Necesidades S/ 1,265", async () => {
    await renderStep4();

    await pressChip("Agua");
    await act(async () => {
      fireEvent.changeText(screen.getByTestId("commitment-amount-0"), "1100");
    });
    await act(async () => {
      fireEvent.changeText(screen.getByTestId("commitment-day-0"), "5");
    });

    await pressChip("Celular");
    await act(async () => {
      fireEvent.changeText(screen.getByTestId("commitment-amount-1"), "96");
    });
    await act(async () => {
      fireEvent.changeText(screen.getByTestId("commitment-day-1"), "10");
    });

    await pressChip("Streaming");
    await act(async () => {
      fireEvent.changeText(screen.getByTestId("commitment-amount-2"), "69");
    });
    await act(async () => {
      fireEvent.changeText(screen.getByTestId("commitment-day-2"), "15");
    });

    expect(screen.getByText("S/ 1,265")).toBeTruthy();
  });

  it("antes de Continuar no muestra qué falta", async () => {
    await renderStep4();
    await pressChip("Agua");
    expect(screen.queryByTestId("commitment-errors-0")).toBeNull();
    expect(
      screen.getByTestId("commitment-row-0").props.className,
    ).not.toContain("border-danger");
  });

  it("Continuar con huecos se queda y dice Falta el monto y el día", async () => {
    await renderStep4();
    await pressChip("Agua");
    await act(async () => {
      fireEvent.press(screen.getByText("Continuar"));
    });
    expect(screen.getByTestId("probe-step").props.children).toBe("4");
    expect(screen.getByTestId("commitment-errors-0").props.children).toBe(
      "Falta el monto y el día.",
    );
    expect(
      screen.getByTestId("commitment-amount-field-0").props.className,
    ).toContain("border-danger");
    expect(
      screen.getByTestId("commitment-day-field-0").props.className,
    ).toContain("border-danger");
  });

  it("al completar monto y día, Continuar avanza a confirm", async () => {
    await renderStep4();
    await pressChip("Agua");
    await act(async () => {
      fireEvent.press(screen.getByText("Continuar"));
    });
    await act(async () => {
      fireEvent.changeText(screen.getByTestId("commitment-amount-0"), "96");
    });
    await act(async () => {
      fireEvent.changeText(screen.getByTestId("commitment-day-0"), "20");
    });
    expect(screen.queryByTestId("commitment-errors-0")).toBeNull();
    await act(async () => {
      fireEvent.press(screen.getByText("Continuar"));
    });
    expect(screen.getByTestId("probe-step").props.children).toBe("confirm");
  });

  it("'Después' avanza al paso confirm sin validación y mantiene el estado", async () => {
    await renderStep4();
    await pressChip("Agua");
    await act(async () => {
      fireEvent.changeText(screen.getByTestId("commitment-amount-0"), "1100");
    });
    await act(async () => {
      fireEvent.press(screen.getByTestId("commitments-skip"));
    });
    expect(screen.getByTestId("probe-step").props.children).toBe("confirm");
    expect(getCommitments()).toHaveLength(1);
    expect(getCommitments()[0].amountCents).toBe(110000);
  });

  it("sin filas, Continuar avanza directo a confirm", async () => {
    await renderStep4();
    await act(async () => {
      fireEvent.press(screen.getByText("Continuar"));
    });
    expect(screen.getByTestId("probe-step").props.children).toBe("confirm");
  });

  it("el back del paso 4 regresa al paso 3 (SET_STEP 3)", async () => {
    await renderStep4();
    await act(async () => {
      fireEvent.press(screen.getByTestId("wizard-back"));
    });
    expect(screen.getByTestId("probe-step").props.children).toBe("3");
    expect(mockBack).not.toHaveBeenCalled();
  });
});
