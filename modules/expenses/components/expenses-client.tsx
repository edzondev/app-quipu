"use client";

import { useState } from "react";
import { format, subMonths, addMonths } from "date-fns";
import { es } from "date-fns/locale";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/core/components/ui/button";
import { useProfile } from "@/core/hooks/use-profile";
import ListCard from "./list-card";

type Envelope = "needs" | "wants" | "juntos";

const ENVELOPE_OPTIONS: { value: Envelope | undefined; label: string }[] = [
  { value: undefined, label: "Todos" },
  { value: "needs", label: "Necesidades" },
  { value: "wants", label: "Gustos" },
  { value: "juntos", label: "Juntos" },
];

const currentYearMonth = format(new Date(), "yyyy-MM");

export default function ExpensesClient() {
  const { hasJuntos } = useProfile();
  const [envelope, setEnvelope] = useState<Envelope | undefined>(undefined);
  const [currentDate, setCurrentDate] = useState(() => new Date());

  const month = format(currentDate, "yyyy-MM");
  const monthLabel = format(currentDate, "MMMM yyyy", { locale: es });
  const isCurrentMonth = month >= currentYearMonth;

  const options = ENVELOPE_OPTIONS.filter(
    (opt) => opt.value !== "juntos" || hasJuntos,
  );

  return (
    <>
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="flex gap-1 flex-wrap">
          {options.map((opt) => (
            <Button
              key={opt.value ?? "all"}
              variant={envelope === opt.value ? "default" : "outline"}
              size="sm"
              onClick={() => setEnvelope(opt.value)}
              className="text-xs"
            >
              {opt.label}
            </Button>
          ))}
        </div>

        <div className="flex items-center gap-1 sm:ml-auto">
          <Button
            variant="outline"
            size="icon"
            className="h-8 w-8"
            onClick={() => setCurrentDate((d) => subMonths(d, 1))}
          >
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <span className="text-sm font-medium min-w-32.5 text-center capitalize">
            {monthLabel}
          </span>
          <Button
            variant="outline"
            size="icon"
            className="h-8 w-8"
            onClick={() => setCurrentDate((d) => addMonths(d, 1))}
            disabled={isCurrentMonth}
          >
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
      </div>

      <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
        <ListCard envelope={envelope} month={month} />
      </div>
    </>
  );
}
