import { useState } from "react";
import { Alert, Pressable, ScrollView, Text, View } from "react-native";
import AppShell from "@/shared/components/app-shell";
import AppTittle from "@/shared/components/app-title";
import { useRegistrar } from "@/shared/components/navigation/registrar-context";
import { useExpenseActions } from "@/shared/hooks/use-expense-actions";
import { useMovements } from "@/shared/hooks/use-movements";
import { readActionError } from "@/shared/lib/expenses/errors";
import { formatCents } from "@/shared/lib/money";
import type {
  EditableExpense,
  MovementRow,
} from "@/shared/lib/movements/model";

const TONE_DOT = {
  needs: "bg-needs",
  wants: "bg-wants",
  savings: "bg-savings",
  income: "bg-foreground/35",
} as const;

const HIT_SLOP = { top: 8, bottom: 8, left: 8, right: 8 };

export default function MovementsPage() {
  const list = useMovements();
  const { openEdit } = useRegistrar();
  const { remove } = useExpenseActions();
  const [error, setError] = useState<string | null>(null);

  function confirmDelete(id: string) {
    Alert.alert("Eliminar gasto", "El monto vuelve al sobre.", [
      { text: "Cancelar", style: "cancel" },
      {
        text: "Eliminar",
        style: "destructive",
        onPress: () => {
          void remove(id).catch((cause: unknown) => {
            setError(readActionError(cause, "No se pudo eliminar el gasto."));
          });
        },
      },
    ]);
  }

  return (
    <AppShell>
      <ScrollView
        contentContainerClassName="gap-4 pb-12"
        showsVerticalScrollIndicator={false}
      >
        <AppTittle title="Movimientos" className="font-semibold" />
        {list.status === "loading" ? (
          <Text className="font-hanken text-[15px] text-foreground/55">
            Cargando…
          </Text>
        ) : null}
        {list.status !== "loading" && list.rows.length === 0 ? (
          <Text className="font-hanken text-[15px] text-foreground/55">
            Sin movimientos en este ciclo.
          </Text>
        ) : null}
        {error ? (
          <Text className="font-hanken text-[13px] text-danger">{error}</Text>
        ) : null}
        {list.rows.map((row) => (
          <MovementLine
            key={row.id}
            row={row}
            symbol={list.currencySymbol}
            onEdit={openEdit}
            onDelete={confirmDelete}
          />
        ))}
      </ScrollView>
    </AppShell>
  );
}

function MovementLine({
  row,
  symbol,
  onEdit,
  onDelete,
}: {
  row: MovementRow;
  symbol: string;
  onEdit: (expense: EditableExpense) => void;
  onDelete: (id: string) => void;
}) {
  const editable = row.editable;
  return (
    <View className="gap-1">
      <View className="flex-row items-center gap-3">
        <View className={`h-1.5 w-1.5 rounded-full ${TONE_DOT[row.tone]}`} />
        <Text className="flex-1 font-hanken-semibold text-[15px] text-foreground">
          {row.label}
        </Text>
        <Text className="font-hanken-semibold text-[15px] text-foreground">
          {row.direction === "out" ? "–" : "+"}{" "}
          {formatCents(row.amountCents, symbol)}
        </Text>
      </View>
      {row.envelopeLabel ? (
        <Text className="pl-4 font-hanken text-[13px] text-foreground/45">
          {row.envelopeLabel}
        </Text>
      ) : null}
      {row.kind === "expense" ? (
        <View className="flex-row gap-4 pl-4">
          {editable ? (
            <Pressable
              accessibilityRole="button"
              hitSlop={HIT_SLOP}
              onPress={() => onEdit(editable)}
            >
              <Text className="font-hanken-semibold text-[14px] text-stable">
                Editar
              </Text>
            </Pressable>
          ) : null}
          <Pressable
            accessibilityRole="button"
            hitSlop={HIT_SLOP}
            onPress={() => onDelete(row.id)}
          >
            <Text className="font-hanken-semibold text-[14px] text-danger">
              Eliminar
            </Text>
          </Pressable>
        </View>
      ) : null}
    </View>
  );
}
