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
import { useIsMobile } from "@/hooks/use-mobile";
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
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent>
        <DrawerHeader className="text-left">
          <DrawerTitle>Editar gasto</DrawerTitle>
          <DrawerDescription>
            Modifica el sobre, monto o descripción de este gasto.
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
          <DrawerClose asChild>
            <Button variant="outline">Cancelar</Button>
          </DrawerClose>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
}
