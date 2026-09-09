import { act, fireEvent, render, screen } from "@testing-library/react-native";
import type { ComponentProps } from "react";
import { ExpenseSuccess } from "@/modules/register/expense-success";

jest.mock("@/shared/components/money/money", () => {
  const { Text } = require("react-native");
  return {
    Money: ({ cents, testID }: { cents: number; testID?: string }) => (
      <Text testID={testID}>{`S/ ${(cents / 100).toFixed(2)}`}</Text>
    ),
  };
});

const onDone = jest.fn();

async function renderSuccess(
  props: Partial<ComponentProps<typeof ExpenseSuccess>> = {},
) {
  return render(
    <ExpenseSuccess
      result={{
        expenseId: "e1",
        envelopeType: "wants",
        amount: 100_00,
        remainingAmount: 30_00,
        spendableCents: 191_900,
        dailyBeforeCents: 50_50,
        dailyAfterCents: 47_98,
        dailyDeltaCents: -2_52,
        daysRemainingInCycle: 40,
        ...props.result,
      }}
      onDone={onDone}
    />,
  );
}

describe("ExpenseSuccess", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("muestra el monto, el sobre y la amortización del ritmo diario", async () => {
    await renderSuccess();

    expect(screen.getByText("GASTO REGISTRADO")).toBeTruthy();
    expect(screen.getByText("S/ 100.00")).toBeTruthy();
    expect(screen.getByText(/Salió de/)).toBeTruthy();
    expect(
      screen.getByText(/Tu ritmo diario baja S\/ 2.52 al día/),
    ).toBeTruthy();
  });

  it("Listo cierra", async () => {
    await renderSuccess();
    await act(async () => {
      fireEvent.press(screen.getByTestId("expense-success-done"));
    });
    expect(onDone).toHaveBeenCalled();
  });
});
