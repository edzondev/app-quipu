import { BottomSheet, Host } from "@expo/ui";
import { useCallback, useState } from "react";
import { Alert, Pressable, ScrollView, Text, View } from "react-native";
import { ExpenseForm } from "@/shared/components/expenses/expense-form";
import { useExpenseActions } from "@/shared/hooks/use-expense-actions";
import { useRecentExpenses } from "@/shared/hooks/use-expenses";
import type {
  ExpenseDraftInput,
  ExpenseField,
} from "@/shared/lib/expenses/draft";
import { ExpenseValidationError } from "@/shared/lib/expenses/draft";
import { readActionError } from "@/shared/lib/expenses/errors";
import { formatCents } from "@/shared/lib/money";
import {
  type EditableExpense,
  editableFromRecentExpense,
} from "@/shared/lib/movements/model";

type Session = {
  nonce: number;
  expense: EditableExpense | null;
};

type Props = {
  isPresented: boolean;
  session: Session;
  onDismiss: () => void;
};

export default function RegistrarSheet({
  isPresented,
  session,
  onDismiss,
}: Props) {
  return (
    <Host>
      <BottomSheet
        isPresented={isPresented}
        onDismiss={onDismiss}
        snapPoints={["half", "full"]}
      >
        <SheetBody
          key={session.nonce}
          expense={session.expense}
          onDone={onDismiss}
        />
      </BottomSheet>
    </Host>
  );
}

function SheetBody({
  expense,
  onDone,
}: {
  expense: EditableExpense | null;
  onDone: () => void;
}) {
  const { register, update, remove } = useExpenseActions();
  const recent = useRecentExpenses();
  const [editing, setEditing] = useState(expense);
  const [fieldError, setFieldError] = useState<{
    field: ExpenseField;
    message: string;
  } | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setSubmitting] = useState(false);

  const submit = useCallback(
    async (input: ExpenseDraftInput) => {
      setFieldError(null);
      setFormError(null);
      setSubmitting(true);
      try {
        if (editing) await update(editing.id, input);
        else await register(input);
        onDone();
      } catch (error) {
        if (error instanceof ExpenseValidationError) {
          setFieldError({ field: error.field, message: error.message });
        } else {
          setFormError(readActionError(error, "No se pudo guardar el gasto."));
        }
      } finally {
        setSubmitting(false);
      }
    },
    [editing, onDone, register, update],
  );

  const confirmDelete = useCallback(
    (id: string) => {
      Alert.alert("Eliminar gasto", "El monto vuelve al sobre.", [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Eliminar",
          style: "destructive",
          onPress: () => {
            void remove(id)
              .then(() => {
                if (editing?.id === id) onDone();
              })
              .catch((error: unknown) => {
                setFormError(
                  readActionError(error, "No se pudo eliminar el gasto."),
                );
              });
          },
        },
      ]);
    },
    [editing?.id, onDone, remove],
  );

  return (
    <ScrollView contentContainerClassName="gap-5 p-6 pb-10">
      <View className="gap-1">
        <Text className="font-geist-mono text-[11px] uppercase tracking-[0.18em] text-foreground/45">
          Quipu · Registrar
        </Text>
        <Text className="font-newsreader text-[26px] text-foreground">
          {editing ? "Editar gasto" : "Registrar gasto"}
        </Text>
      </View>
      <ExpenseForm
        key={editing?.id ?? "create"}
        initial={editing ?? undefined}
        submitLabel={editing ? "Actualizar" : "Guardar"}
        fieldError={fieldError}
        formError={formError}
        isSubmitting={isSubmitting}
        onSubmit={(input) => {
          void submit(input);
        }}
        onDelete={editing ? () => confirmDelete(editing.id) : undefined}
      />
      <View className="gap-3">
        <Text className="font-geist-mono text-[10.5px] uppercase tracking-[0.18em] text-foreground/45">
          Recientes
        </Text>
        {recent.expenses.length === 0 ? (
          <Text className="font-hanken text-[14px] text-foreground/55">
            Sin gastos recientes.
          </Text>
        ) : (
          recent.expenses.map((item) => {
            const editable = editableFromRecentExpense(item);
            return (
              <View key={item._id} className="flex-row items-center gap-3">
                <Text className="flex-1 font-hanken-semibold text-[15px] text-foreground">
                  {item.description || "Gasto"}
                </Text>
                <Text className="font-hanken-semibold text-[15px] text-foreground">
                  {formatCents(item.amount)}
                </Text>
                {editable ? (
                  <Pressable
                    accessibilityRole="button"
                    onPress={() => {
                      setFieldError(null);
                      setFormError(null);
                      setEditing(editable);
                    }}
                  >
                    <Text className="font-hanken-semibold text-[14px] text-stable">
                      Editar
                    </Text>
                  </Pressable>
                ) : null}
                <Pressable
                  accessibilityRole="button"
                  onPress={() => confirmDelete(item._id)}
                >
                  <Text className="font-hanken-semibold text-[14px] text-danger">
                    Eliminar
                  </Text>
                </Pressable>
              </View>
            );
          })
        )}
      </View>
    </ScrollView>
  );
}
