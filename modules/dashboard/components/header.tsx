import { Button } from "@/core/components/ui/button";
import Link from "next/link";
import { Plus } from "lucide-react";

const MONTH_NAMES_ES = [
  "enero",
  "febrero",
  "marzo",
  "abril",
  "mayo",
  "junio",
  "julio",
  "agosto",
  "septiembre",
  "octubre",
  "noviembre",
  "diciembre",
];

type HeaderProps = {
  name?: string;
  month?: string; // "YYYY-MM"
};

export default function Header({ name, month }: HeaderProps) {
  const monthName = month
    ? (MONTH_NAMES_ES[parseInt(month.split("-")[1], 10) - 1] ?? month)
    : "";

  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
      <div>
        <p className="text-muted-foreground">Hola, {name} 👋</p>
        <h1 className="text-3xl font-bold tracking-tight">
          Tu mes de {monthName}
        </h1>
      </div>
      <Button asChild className="gap-2 w-fit">
        <Link href="/add-expense">
          <Plus className="w-4 h-4" /> Registrar gasto
        </Link>
      </Button>
    </div>
  );
}
