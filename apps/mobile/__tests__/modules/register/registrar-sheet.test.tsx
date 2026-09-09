import { act, fireEvent, render, screen } from "@testing-library/react-native";
import RegistrarSheet from "@/shared/components/navigation/registrar-sheet";

jest.mock("@expo/ui", () => {
  const { View } = require("react-native");
  return {
    Host: ({ children }: { children: unknown }) => (
      <View testID="expo-host">{children}</View>
    ),
    BottomSheet: ({ children }: { children: unknown }) => (
      <View testID="expo-sheet">{children}</View>
    ),
    RNHostView: ({ children }: { children: unknown }) => (
      <View testID="rn-host">{children}</View>
    ),
  };
});

jest.mock("@/modules/home/use-home-summary", () => ({
  useHomeSummary: () => ({
    kind: "active" as const,
    dailyCents: 4230,
  }),
}));

const mockExpenseSubmit = jest.fn();

jest.mock("@/modules/register/use-register-expense", () => ({
  useRegisterExpense: () => ({
    submit: mockExpenseSubmit,
    submitting: false,
    error: null,
  }),
}));

const mockIncomeSubmit = jest.fn();

jest.mock("@/modules/register/use-register-income", () => ({
  useRegisterIncome: () => ({
    weights: {
      allocationNeeds: 50,
      allocationWants: 30,
      allocationSavings: 20,
    },
    commitmentsRemainingCents: 0,
    extraordinaryRules: undefined,
    submit: mockIncomeSubmit,
    submitting: false,
    error: null,
  }),
}));

jest.mock("@/shared/components/ui/reicon", () => {
  const { View } = require("react-native");
  return {
    Camera: () => <View testID="icon-camera" />,
    Backspace: () => <View testID="icon-backspace" />,
    ChevronLeft: () => <View testID="icon-back" />,
  };
});

async function tap(element: ReturnType<typeof screen.getByTestId>) {
  await act(async () => {
    fireEvent.press(element);
  });
}

describe("RegistrarSheet", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockExpenseSubmit.mockResolvedValue(null);
    mockIncomeSubmit.mockResolvedValue(false);
  });

  it("muestra el formulario de gasto dentro de RNHostView por defecto", async () => {
    await render(<RegistrarSheet view="expense" onDismiss={jest.fn()} />);

    expect(screen.getByTestId("rn-host")).toBeTruthy();
    expect(screen.getByTestId("keypad-1")).toBeTruthy();
    expect(screen.getByTestId("submit-expense")).toBeTruthy();
  });

  it("'Es un ingreso' cambia a la vista de ingreso sin cerrar el sheet", async () => {
    await render(<RegistrarSheet view="expense" onDismiss={jest.fn()} />);

    await tap(screen.getByTestId("expense-to-income"));

    expect(screen.getByTestId("income-amount")).toBeTruthy();
    expect(screen.getByTestId("submit-income")).toBeTruthy();
  });

  it("el back del ingreso regresa a la vista de gasto", async () => {
    await render(<RegistrarSheet view="income" onDismiss={jest.fn()} />);

    expect(screen.getByTestId("income-amount")).toBeTruthy();
    await tap(screen.getByLabelText("Volver"));

    expect(screen.getByTestId("submit-expense")).toBeTruthy();
  });

  it("un gasto exitoso muestra la vista de éxito", async () => {
    mockExpenseSubmit.mockResolvedValue({
      ok: true,
      result: {
        amount: 1500,
        envelopeType: "wants",
        dailyDeltaCents: -50,
        dailyAfterCents: 4180,
        daysRemainingInCycle: 22,
      },
    });

    await render(<RegistrarSheet view="expense" onDismiss={jest.fn()} />);

    await tap(screen.getByTestId("keypad-1"));
    await tap(screen.getByTestId("submit-expense"));

    expect(screen.getByTestId("expense-success-done")).toBeTruthy();
  });

  it("deja de renderizar contenido cuando está cerrado", async () => {
    await render(<RegistrarSheet view={null} onDismiss={jest.fn()} />);

    expect(screen.queryByTestId("submit-expense")).toBeNull();
    expect(screen.queryByTestId("submit-income")).toBeNull();
  });
});
