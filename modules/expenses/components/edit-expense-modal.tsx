"use client";

import type { Id } from "@/convex/_generated/dataModel";
import { Button } from "@/core/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/core/components/ui/dialog";
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from "@/core/components/ui/drawer";
import { Separator } from "@/core/components/ui/separator";
import { useIsMobile } from "@/hooks/use-mobile";
import { DeleteExpenseButton } from "./delete-expense-button";
import { EditExpenseForm } from "./edit-expense-form";

type ExpenseData = {
  _id: Id<"expenses">;
  amount: number;
  envelope: "needs" | "wants" | "juntos";
  description?: string;
};

type Props = {
  expense: ExpenseData | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function EditExpenseModal({ expense, open, onOpenChange }: Props) {
  const isMobile = useIsMobile();

  if (!expense) return null;

  const defaultValues = {
    amount: expense.amount,
    envelope: expense.envelope,
    description: expense.description ?? "",
  };

  const handleSuccess = () => {
    onOpenChange(false);
  };

  if (!isMobile) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Editar gasto</DialogTitle>
            <DialogDescription>
              Modifica el sobre, monto o descripción de este gasto.
            </DialogDescription>
          </DialogHeader>
          <EditExpenseForm
            key={expense._id}
            expenseId={expense._id}
            defaultValues={defaultValues}
            onSuccess={handleSuccess}
          />
          <Separator className="my-2" />
          <DeleteExpenseButton
            expenseId={expense._id}
            onDelete={handleSuccess}
          />
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent>
        <DrawerHeader className="text-left">
          <DrawerTitle>Modificar gasto</DrawerTitle>
          <DrawerDescription>
            Modifica los detalles de este gasto o elimínalo.
          </DrawerDescription>
        </DrawerHeader>
        <EditExpenseForm
          key={expense._id}
          expenseId={expense._id}
          defaultValues={defaultValues}
          onSuccess={handleSuccess}
          className="px-4"
        />
        <DrawerFooter className="pt-2">
          <DeleteExpenseButton
            expenseId={expense._id}
            onDelete={handleSuccess}
          />
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
}
