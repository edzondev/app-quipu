import { act, fireEvent, render, screen } from "@testing-library/react-native";
import { useEffect } from "react";
import { Text } from "react-native";
import { Step3Allocation } from "@/modules/onboarding/components/step-3-allocation";
import {
  OnboardingProvider,
  useOnboarding,
} from "@/modules/onboarding/onboarding-provider";

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
  };
});

jest.mock("@expo/ui/community/slider", () => {
  const { View } = require("react-native");
  return {
    Slider: (props: { onValueChange: (value: number) => void }) => (
      <View onValueChange={props.onValueChange} />
    ),
  };
});

function setSlider(testId: string, value: number) {
  const wrapper = screen.getByTestId(testId);
  const slider = wrapper.props.children;
  return act(async () => {
    slider.props.onValueChange(value);
  });
}

function SeedState({ reference }: { reference: number | null }) {
  const { dispatch } = useOnboarding();
  useEffect(() => {
    dispatch({ type: "UPDATE", payload: { referenceIncomeCents: reference } });
    dispatch({ type: "SET_STEP", payload: 3 });
  }, [dispatch, reference]);
  return null;
}

function StateProbe() {
  const { state } = useOnboarding();
  return (
    <>
      <Text testID="probe-step">{String(state.step)}</Text>
      <Text testID="probe-needs">{String(state.allocationNeeds)}</Text>
      <Text testID="probe-wants">{String(state.allocationWants)}</Text>
      <Text testID="probe-savings">{String(state.allocationSavings)}</Text>
    </>
  );
}

async function renderStep3(reference: number | null) {
  return render(
    <OnboardingProvider>
      <SeedState reference={reference} />
      <StateProbe />
      <Step3Allocation />
    </OnboardingProvider>,
  );
}

describe("Step3Allocation — reparto 50/30/20", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("muestra el header del paso 03, las 3 filas y el indicador de suma", async () => {
    await renderStep3(null);
    expect(screen.getByText("TU SISTEMA · 03/04")).toBeTruthy();
    expect(screen.getByText("Necesidades")).toBeTruthy();
    expect(screen.getByText("Gustos")).toBeTruthy();
    expect(screen.getByText("Ahorro")).toBeTruthy();
    expect(screen.getByTestId("allocation-percent-needs").props.children).toBe(
      "50%",
    );
    expect(screen.getByTestId("allocation-percent-wants").props.children).toBe(
      "30%",
    );
    expect(
      screen.getByTestId("allocation-percent-savings").props.children,
    ).toBe("20%");
    expect(screen.getByTestId("allocation-sum").props.children).toBe("100%");
    expect(screen.getByTestId("icon-check")).toBeTruthy();
  });

  it("muestra montos S/ junto al % con referencia 350000 (defaults)", async () => {
    await renderStep3(350000);
    expect(screen.getByTestId("allocation-amount-needs")).toBeTruthy();
    expect(screen.getByText("S/ 1,750")).toBeTruthy();
    expect(screen.getByText("S/ 1,050")).toBeTruthy();
    expect(screen.getByText("S/ 700")).toBeTruthy();
  });

  it("sin referencia no muestra montos", async () => {
    await renderStep3(null);
    expect(screen.queryByTestId("allocation-amount-needs")).toBeNull();
    expect(screen.queryByTestId("allocation-amount-wants")).toBeNull();
    expect(screen.queryByTestId("allocation-amount-savings")).toBeNull();
  });

  it("mover Necesidades a 60 redistribuye Gustos y Ahorro (60/24/16, suma 100)", async () => {
    await renderStep3(350000);
    await setSlider("allocation-slider-needs", 60);
    expect(screen.getByTestId("probe-needs").props.children).toBe("60");
    expect(screen.getByTestId("probe-wants").props.children).toBe("24");
    expect(screen.getByTestId("probe-savings").props.children).toBe("16");
    expect(screen.getByTestId("allocation-percent-wants").props.children).toBe(
      "24%",
    );
    expect(
      screen.getByTestId("allocation-percent-savings").props.children,
    ).toBe("16%");
    expect(screen.getByTestId("allocation-sum").props.children).toBe("100%");
    expect(screen.getByText("S/ 2,100")).toBeTruthy();
    expect(screen.getByText("S/ 840")).toBeTruthy();
    expect(screen.getByText("S/ 560")).toBeTruthy();
  });

  it("mover Gustos a 40 redistribuye Necesidades y Ahorro (43/40/17, suma 100)", async () => {
    await renderStep3(null);
    await setSlider("allocation-slider-wants", 40);
    expect(screen.getByTestId("probe-needs").props.children).toBe("43");
    expect(screen.getByTestId("probe-wants").props.children).toBe("40");
    expect(screen.getByTestId("probe-savings").props.children).toBe("17");
    expect(screen.getByTestId("allocation-sum").props.children).toBe("100%");
  });

  it("redondea valores flotantes del slider a enteros (60.65… → 61, suma 100)", async () => {
    await renderStep3(null);
    await setSlider("allocation-slider-needs", 60.65657567567766);
    expect(screen.getByTestId("probe-needs").props.children).toBe("61");
    expect(screen.getByTestId("probe-wants").props.children).toBe("23");
    expect(screen.getByTestId("probe-savings").props.children).toBe("16");
    expect(screen.getByTestId("allocation-sum").props.children).toBe("100%");
  });

  it("'Volver al 50/30/20 recomendado' restaura los defaults", async () => {
    await renderStep3(350000);
    await setSlider("allocation-slider-needs", 60);
    expect(screen.getByTestId("probe-needs").props.children).toBe("60");
    await act(async () => {
      fireEvent.press(screen.getByTestId("allocation-reset"));
    });
    expect(screen.getByTestId("probe-needs").props.children).toBe("50");
    expect(screen.getByTestId("probe-wants").props.children).toBe("30");
    expect(screen.getByTestId("probe-savings").props.children).toBe("20");
    expect(screen.getByText("S/ 1,750")).toBeTruthy();
  });

  it("Continuar avanza al paso 4 (compromisos)", async () => {
    await renderStep3(null);
    await act(async () => {
      fireEvent.press(screen.getByText("Continuar"));
    });
    expect(screen.getByTestId("probe-step").props.children).toBe("4");
  });
});
