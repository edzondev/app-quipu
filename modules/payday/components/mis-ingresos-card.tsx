"use client";

import { Pencil, Plus } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import type { Id } from "@/convex/_generated/dataModel";
import { Badge } from "@/core/components/ui/badge";
import { Button } from "@/core/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/core/components/ui/card";
import { Separator } from "@/core/components/ui/separator";
import { AddExtraIncomeForm } from "./add-extra-income-form";
import { ExtraIncomeItem } from "./extra-income-item";

type ExtraIncome = {
  _id: Id<"extraIncomes">;
  name: string;
  amount: number;
  includeInBudget: boolean;
};

type Props = {
  currencySymbol: string;
  monthlyIncome: number;
  extraIncomes: ExtraIncome[];
  totalAssignable: number;
};

export function MisIngresosCard({
  currencySymbol,
  monthlyIncome,
  extraIncomes,
  totalAssignable,
}: Props) {
  const [showAddForm, setShowAddForm] = useState(false);

  const formattedSalary = monthlyIncome.toLocaleString("es", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  });

  const formattedTotal = totalAssignable.toLocaleString("es", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  });

  return (
    <Card className="gap-2">
      <CardHeader>
        <CardTitle className="text-base font-semibold">Mis ingresos</CardTitle>
      </CardHeader>
      <CardContent className="space-y-1">
        {/* Salary row */}
        <div className="flex items-center justify-between py-2">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium">Sueldo principal</span>
            <Badge variant="secondary">Recurrente</Badge>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold tabular-nums">
              {currencySymbol} {formattedSalary}
            </span>
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              className="text-muted-foreground hover:text-foreground"
              asChild
            >
              <Link
                href="/settings"
                aria-label="Editar sueldo en configuración"
              >
                <Pencil className="h-3.5 w-3.5" />
              </Link>
            </Button>
          </div>
        </div>

        {/* Extra incomes list */}
        {extraIncomes.map((income) => (
          <ExtraIncomeItem
            key={income._id}
            income={income}
            currencySymbol={currencySymbol}
          />
        ))}

        {/* Add form with smooth open/close transition */}
        <div className="mt-2">
          <div
            className={`overflow-hidden transition-all duration-300 ease-out ${
              showAddForm
                ? "max-h-128 opacity-100 translate-y-0"
                : "max-h-0 opacity-0 -translate-y-1 pointer-events-none"
            }`}
          >
            <AddExtraIncomeForm onDone={() => setShowAddForm(false)} />
          </div>

          <div
            className={`overflow-hidden transition-all duration-300 ease-out ${
              showAddForm
                ? "max-h-0 opacity-0 -translate-y-1 pointer-events-none"
                : "max-h-16 opacity-100 translate-y-0"
            }`}
          >
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="w-full"
              onClick={() => setShowAddForm(true)}
            >
              <Plus className="h-4 w-4 mr-1" />
              Agregar ingreso extra
            </Button>
          </div>
        </div>

        <Separator className="my-3" />

        {/* Total */}
        <div className="flex items-center justify-between pt-1">
          <span className="text-sm text-muted-foreground">
            Total asignable este mes
          </span>
          <span className="text-base font-bold tabular-nums">
            {currencySymbol} {formattedTotal}
          </span>
        </div>
      </CardContent>
    </Card>
  );
}
