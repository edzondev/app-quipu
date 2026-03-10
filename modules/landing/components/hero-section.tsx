import { Card, CardContent } from "@/core/components/ui/card";
import { ShieldCheck } from "lucide-react";

export default function HeroSection() {
  return (
    <section className="max-w-4xl mx-auto px-6 pt-20 pb-16 text-center">
      <h1 className="text-4xl md:text-5xl lg:text-6xl font-semibold tracking-tight leading-tight">
        Decide a dónde va tu sueldo antes de recibirlo.
      </h1>
      <p className="mt-5 text-lg text-muted-foreground max-w-2xl mx-auto">
        La mayoría de apps te muestran en qué gastaste. Quipu te ayuda a decidir
        antes de gastar.
      </p>
      <div className="mt-4 inline-flex items-center gap-2 text-sm text-muted-foreground border border-border rounded-full px-4 py-1.5">
        <ShieldCheck className="w-4 h-4 text-primary shrink-0" />
        Sin conexión bancaria · Tu banco no sabe que usas Quipu
      </div>

      {/* Dashboard mockup */}
      <div className="mt-14 max-w-3xl mx-auto overflow-hidden rounded-xl border border-border shadow-lg max-h-auto">
        <div className="bg-card p-5 space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-sm font-semibold text-muted-foreground">
              Tu plan de mayo
            </span>
            <span className="text-xs text-muted-foreground">
              Sueldo: S/ 5,000
            </span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <Card className="border-l-4 border-l-envelope-needs">
              <CardContent>
                <p className="text-xs font-semibold text-muted-foreground">
                  Necesidades
                </p>
                <p className="text-2xl font-semibold mt-1">S/ 2,500</p>
                <p className="text-xs text-muted-foreground mt-1">
                  50% del sueldo
                </p>
              </CardContent>
            </Card>
            <Card className="border-l-4 border-l-envelope-wants">
              <CardContent>
                <p className="text-xs font-semibold text-muted-foreground">
                  Gustos
                </p>
                <p className="text-2xl font-semibold mt-1">S/ 1,500</p>
                <p className="text-xs text-muted-foreground mt-1">
                  30% del sueldo
                </p>
              </CardContent>
            </Card>
            <Card className="border-l-4 border-l-envelope-savings">
              <CardContent>
                <p className="text-xs font-semibold text-muted-foreground">
                  Ahorro
                </p>
                <p className="text-2xl font-semibold mt-1">S/ 1,000</p>
                <p className="text-xs text-muted-foreground mt-1">
                  20% del sueldo
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </section>
  );
}
