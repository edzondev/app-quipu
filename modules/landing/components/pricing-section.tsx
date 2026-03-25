import { Button } from "@/core/components/ui/button";
import { Card, CardContent } from "@/core/components/ui/card";
import { Badge } from "@/core/components/ui/badge";
import { cn } from "@/lib/utils";
import { Check, Minus } from "lucide-react";
import PremiumCheckoutButton from "./premium-checkout-button";
import Link from "next/link";

const FREE_FEATURES = [
  "Asignación automática 50/30/20",
  "3 sobres principales",
  "Registro de gastos",
  "Fondo de emergencia",
  "Coach básico",
];

const PREMIUM_FEATURES = [
  "Objetivos de ahorro ilimitados",
  "Modo Rescate avanzado",
  "Gratificaciones y CTS",
  "Modo pareja",
  "Coach con IA personalizado",
];

const COMPARISON: Array<{
  label: string;
  free: string | boolean;
  premium: string | boolean;
}> = [
  { label: "Sobres de presupuesto", free: "3 sobres", premium: "3 + Juntos" },
  { label: "Registro de gastos", free: "20 / mes", premium: "Ilimitados" },
  { label: "Objetivos de ahorro", free: "1 objetivo", premium: "Ilimitados" },
  { label: "Día de pago", free: true, premium: true },
  { label: "Cuotas y deudas fijas", free: false, premium: true },
  { label: "Modo Rescate", free: false, premium: true },
  { label: "Modo Pareja", free: false, premium: true },
  { label: "Badges y logros", free: "3 iniciales", premium: "Completos" },
  { label: "Rachas mensuales", free: false, premium: true },
  { label: "Coach financiero", free: "1 / semana", premium: "Diario" },
];

function ComparisonCell({ value }: { value: string | boolean }) {
  if (value === true) {
    return <Check className="w-4 h-4 text-primary mx-auto" />;
  }
  if (value === false) {
    return <Minus className="w-4 h-4 text-muted-foreground/40 mx-auto" />;
  }
  return (
    <span className="text-sm text-center block leading-snug">{value}</span>
  );
}

export default function PricingSection() {
  return (
    <section className="bg-muted py-20 px-6">
      <div className="max-w-4xl mx-auto text-center">
        <h2 className="text-3xl md:text-4xl font-semibold tracking-tight">
          Simple como debe ser.
        </h2>

        {/* Plan cards */}
        <div className="mt-14 grid grid-cols-1 md:grid-cols-2 gap-6 max-w-2xl mx-auto">
          {/* Free */}
          <Card>
            <CardContent className="p-6 space-y-5 flex flex-col justify-between min-h-full">
              <div>
                <h3 className="text-lg font-semibold">Gratis</h3>
                <p className="text-3xl font-semibold mt-2">USD 0</p>
              </div>
              <ul className="space-y-2 text-sm text-left">
                {FREE_FEATURES.map((f) => (
                  <li key={f} className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-primary shrink-0" />
                    {f}
                  </li>
                ))}
              </ul>
              <Button variant="outline" className="w-full self-end" asChild>
                <Link href="/register">Empezar gratis</Link>
              </Button>
            </CardContent>
          </Card>

          {/* Premium */}
          <Card className="border-primary border-2 relative">
            <div className="absolute -top-3 left-1/2 -translate-x-1/2">
              <Badge>Más popular</Badge>
            </div>
            <CardContent className="p-6 space-y-5">
              <div>
                <h3 className="text-lg font-semibold">Premium</h3>
                <p className="text-3xl font-semibold mt-2">
                  USD 4.99{" "}
                  <span className="text-base font-normal text-muted-foreground">
                    / mes
                  </span>
                </p>
              </div>
              <p className="text-sm text-muted-foreground text-left">
                Todo en Gratis, más:
              </p>
              <ul className="space-y-2 text-sm text-left">
                {PREMIUM_FEATURES.map((f) => (
                  <li key={f} className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-primary shrink-0" />
                    {f}
                  </li>
                ))}
              </ul>
              <PremiumCheckoutButton />
            </CardContent>
          </Card>
        </div>

        {/* Comparison table */}
        <div className="mt-16 max-w-2xl mx-auto">
          <h3 className="text-xl font-semibold mb-8">Comparativa detallada</h3>

          <div className="rounded-xl border border-border overflow-hidden text-left">
            {/* Header */}
            <div className="grid grid-cols-3 bg-background px-5 py-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              <span>Función</span>
              <span className="text-center">Gratis</span>
              <span className="text-center">Premium</span>
            </div>

            {/* Rows */}
            {COMPARISON.map((row, i) => (
              <div
                key={row.label}
                className={cn(
                  "grid grid-cols-3 items-center px-5 py-3.5 text-sm",
                  i % 2 === 0 ? "bg-muted/40" : "bg-muted/70",
                )}
              >
                <span className="font-medium pr-4">{row.label}</span>
                <div className="flex justify-center">
                  <ComparisonCell value={row.free} />
                </div>
                <div className="flex justify-center">
                  <ComparisonCell value={row.premium} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
