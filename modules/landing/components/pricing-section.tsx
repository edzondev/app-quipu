import { Button } from "@/core/components/ui/button";
import { Card, CardContent } from "@/core/components/ui/card";
import { Badge } from "@/core/components/ui/badge";
import { Check } from "lucide-react";
import PremiumCheckoutButton from "./premium-checkout-button";

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

export default function PricingSection() {
  return (
    <section className="bg-muted py-20 px-6">
      <div className="max-w-4xl mx-auto text-center">
        <h2 className="text-3xl md:text-4xl font-semibold tracking-tight">
          Simple como debe ser.
        </h2>
        <div className="mt-14 grid grid-cols-1 md:grid-cols-2 gap-6 max-w-2xl mx-auto">
          {/* Free */}
          <Card>
            <CardContent className="p-6 space-y-5">
              <div>
                <h3 className="text-lg font-semibold">Gratis</h3>
                <p className="text-3xl font-semibold mt-2">S/ 0</p>
              </div>
              <ul className="space-y-2 text-sm text-left">
                {FREE_FEATURES.map((f) => (
                  <li key={f} className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-primary shrink-0" />
                    {f}
                  </li>
                ))}
              </ul>
              <Button variant="outline" className="w-full">
                Empezar gratis
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
                  S/ 14{" "}
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
      </div>
    </section>
  );
}
