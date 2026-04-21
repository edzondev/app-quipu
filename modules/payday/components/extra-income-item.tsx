"use client";

import { useMutation } from "convex/react";
import { ConvexError } from "convex/values";
import { Pencil, Trash2 } from "lucide-react";
import { useState } from "react";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/core/components/ui/alert-dialog";
import { Badge } from "@/core/components/ui/badge";
import { Button } from "@/core/components/ui/button";
import { Input } from "@/core/components/ui/input";
import { Switch } from "@/core/components/ui/switch";
import { cn } from "@/lib/utils";

type ExtraIncome = {
  _id: Id<"extraIncomes">;
  name: string;
  amount: number;
  includeInBudget: boolean;
};

type Props = {
  income: ExtraIncome;
  currencySymbol: string;
};

export function ExtraIncomeItem({ income, currencySymbol }: Props) {
  const updateExtraIncome = useMutation(api.extraIncomes.updateExtraIncome);
  const deleteExtraIncome = useMutation(api.extraIncomes.deleteExtraIncome);

  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState(income.name);
  const [editAmount, setEditAmount] = useState(String(income.amount));
  const [editInclude, setEditInclude] = useState(income.includeInBudget);
  const [isPending, setIsPending] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [editError, setEditError] = useState<string | null>(null);

  function startEditing() {
    setEditName(income.name);
    setEditAmount(String(income.amount));
    setEditInclude(income.includeInBudget);
    setEditError(null);
    setIsEditing(true);
  }

  async function handleSave() {
    const amount = Number(editAmount);
    if (!editName.trim() || editName.trim().length < 2) {
      setEditError("El nombre debe tener al menos 2 caracteres");
      return;
    }
    if (!editAmount || amount <= 0) {
      setEditError("El monto debe ser mayor a 0");
      return;
    }
    setIsPending(true);
    setEditError(null);
    try {
      await updateExtraIncome({
        incomeId: income._id,
        name: editName.trim(),
        amount,
        includeInBudget: editInclude,
      });
      setIsEditing(false);
    } catch (e: unknown) {
      setEditError(
        e instanceof ConvexError
          ? String(e.data)
          : "Error al guardar. Inténtalo de nuevo.",
      );
    } finally {
      setIsPending(false);
    }
  }

  async function handleToggle(checked: boolean) {
    try {
      await updateExtraIncome({
        incomeId: income._id,
        includeInBudget: checked,
      });
    } catch {
      // silent — Convex will revert the optimistic update
    }
  }

  async function handleDelete() {
    if (isDeleting) return;
    setDeleteError(null);
    setIsDeleting(true);
    try {
      await deleteExtraIncome({ incomeId: income._id });
    } catch (e: unknown) {
      setDeleteError(
        e instanceof ConvexError
          ? String(e.data)
          : "Ocurrió un error. Inténtalo de nuevo.",
      );
    } finally {
      setIsDeleting(false);
    }
  }

  const formattedAmount = income.amount.toLocaleString("es", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  });

  if (isEditing) {
    return (
      <div className="flex flex-col gap-2 py-2">
        <div className="flex items-center gap-2">
          <Input
            value={editName}
            onChange={(e) => setEditName(e.target.value)}
            placeholder="Nombre"
            className="h-8 text-sm"
          />
          <Input
            type="number"
            min={0}
            step={1}
            value={editAmount}
            onChange={(e) => setEditAmount(e.target.value)}
            placeholder="Monto"
            className="h-8 w-28 text-sm"
          />
        </div>
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Switch
              size="sm"
              checked={editInclude}
              onCheckedChange={setEditInclude}
            />
            <span className="text-xs text-muted-foreground">
              Incluir en presupuesto
            </span>
          </div>
          <div className="flex gap-1">
            <Button
              size="sm"
              variant="ghost"
              className="h-7 px-2 text-xs"
              onClick={() => setIsEditing(false)}
              disabled={isPending}
            >
              Cancelar
            </Button>
            <Button
              size="sm"
              className="h-7 px-3 text-xs"
              onClick={handleSave}
              disabled={isPending}
            >
              {isPending ? "Guardando..." : "OK"}
            </Button>
          </div>
        </div>
        {editError && <p className="text-destructive text-xs">{editError}</p>}
      </div>
    );
  }

  return (
    <div className="flex items-center justify-between py-2 gap-3">
      <div className="flex items-center gap-2 min-w-0">
        <span
          className={cn(
            "text-sm font-medium truncate",
            !income.includeInBudget && "text-muted-foreground",
          )}
        >
          {income.name}
        </span>
        <span
          className={cn(
            "text-sm tabular-nums shrink-0",
            !income.includeInBudget && "text-muted-foreground",
          )}
        >
          {currencySymbol} {formattedAmount}
        </span>
        {income.includeInBudget ? (
          <Badge className="bg-emerald-500/15 text-emerald-600 border-0 shrink-0">
            Extra
          </Badge>
        ) : (
          <Badge variant="secondary" className="shrink-0">
            Solo registro
          </Badge>
        )}
      </div>
      <div className="flex items-center gap-1 shrink-0">
        <Switch
          size="sm"
          checked={income.includeInBudget}
          onCheckedChange={handleToggle}
        />
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="h-8 w-8 text-muted-foreground hover:text-foreground"
          onClick={startEditing}
        >
          <Pencil className="h-3.5 w-3.5" />
        </Button>
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-muted-foreground hover:text-destructive"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>¿Eliminar este ingreso?</AlertDialogTitle>
              <AlertDialogDescription>
                Esta acción no se puede deshacer.
                {deleteError && (
                  <span className="mt-2 block text-destructive">
                    {deleteError}
                  </span>
                )}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <AlertDialogAction
                variant="destructive"
                onClick={handleDelete}
                disabled={isDeleting}
              >
                {isDeleting ? "Eliminando..." : "Eliminar"}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
}
