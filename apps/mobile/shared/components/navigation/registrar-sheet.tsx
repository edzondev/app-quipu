import { BottomSheet, RNHostView } from "@expo/ui";
import { useState } from "react";
import { View } from "react-native";
import { useHomeSummary } from "@/modules/home/use-home-summary";
import { ExpenseSheet } from "@/modules/register/expense-sheet";
import { ExpenseSuccess } from "@/modules/register/expense-success";
import { IncomeScreen } from "@/modules/register/income-screen";
import {
  type ExpenseRegisterOutcome,
  useRegisterExpense,
} from "@/modules/register/use-register-expense";
import { useRegisterIncome } from "@/modules/register/use-register-income";
import type { RegistrarView } from "./registrar-sheet-context";

type Props = {
  /** Vista inicial con la que se abrió el sheet. `null` = cerrado. */
  view: RegistrarView | null;
  onDismiss: () => void;
};

type SheetView =
  | { name: "expense" }
  | { name: "income" }
  | { name: "success"; result: ExpenseRegisterOutcome };

export default function RegistrarSheet({ view, onDismiss }: Props) {
  const homeView = useHomeSummary();
  const expense = useRegisterExpense();
  const income = useRegisterIncome();
  // El layout remonta este componente por key al reabrirlo, así que el
  // estado interno siempre empieza en la vista inicial pedida.
  const [current, setCurrent] = useState<SheetView>(() => ({
    name: view === "income" ? "income" : "expense",
  }));

  const isPresented = view !== null;
  const todayCents = homeView.kind === "active" ? homeView.dailyCents : null;

  const close = () => {
    setCurrent({ name: "expense" });
    onDismiss();
  };

  return (
    <BottomSheet
      isPresented={isPresented}
      onDismiss={close}
      snapPoints={[{ fraction: 0.9 }]}
      containerColor="#FBFAF7"
      contentPadding={0}
    >
      {isPresented ? (
        <RNHostView>
          <View className="flex-1 px-5">
            {current.name === "success" ? (
              <ExpenseSuccess result={current.result} onDone={close} />
            ) : current.name === "income" ? (
              <IncomeScreen
                weights={income.weights}
                commitmentsRemainingCents={income.commitmentsRemainingCents}
                extraordinaryRules={income.extraordinaryRules}
                submitting={income.submitting}
                error={income.error}
                onBack={() => setCurrent({ name: "expense" })}
                onSubmit={async (args) => {
                  const ok = await income.submit(args);
                  if (ok) close();
                }}
              />
            ) : (
              <ExpenseSheet
                todayCents={todayCents}
                submitting={expense.submitting}
                error={expense.error}
                onCancel={close}
                onSubmit={async (input) => {
                  const outcome = await expense.submit(input);
                  if (outcome?.ok) {
                    setCurrent({ name: "success", result: outcome.result });
                  }
                }}
                onIncome={() => setCurrent({ name: "income" })}
              />
            )}
          </View>
        </RNHostView>
      ) : null}
    </BottomSheet>
  );
}
