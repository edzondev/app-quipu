import { Button } from "@/core/components/ui/button";
import { Plus } from "lucide-react";

type HeaderProps = {
  name?: string;
  month?: string;
};

export default function Header({ name, month }: HeaderProps) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
      <div>
        <p className="text-muted-foreground">Hola, {name} 👋</p>
        <h1 className="text-3xl font-bold tracking-tight">Tu mes de {month}</h1>
      </div>
      <Button className="gap-2 w-fit">
        <Plus className="w-4 h-4" /> Registrar gasto
      </Button>
    </div>
  );
}
