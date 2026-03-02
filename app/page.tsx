import { Button } from "@/core/components/ui/button";
import { Card, CardContent } from "@/core/components/ui/card";
import { Badge } from "@/core/components/ui/badge";
import { Calendar, Layers, ShieldCheck, Check } from "lucide-react";

export default function Home() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* ── NAVBAR ── */}
      <nav className="sticky top-0 z-50 bg-background/80 backdrop-blur-md border-b border-border">
        <div className="container mx-auto flex items-center justify-between px-6 py-4">
          <span className="text-xl font-semibold tracking-tight">quipu</span>
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm">
              Iniciar sesión
            </Button>
            <Button size="sm">Empezar gratis</Button>
          </div>
        </div>
      </nav>

      {/* ── 1. HERO ── */}
      <section className="max-w-4xl mx-auto px-6 pt-20 pb-16 text-center">
        <h1 className="text-4xl md:text-5xl lg:text-6xl font-semibold tracking-tight leading-tight">
          Decide a dónde va tu sueldo antes de recibirlo.
        </h1>
        <p className="mt-5 text-lg text-muted-foreground max-w-2xl mx-auto">
          La mayoría de apps te muestran en qué gastaste. Quipu te ayuda a
          decidir antes de gastar.
        </p>
        <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
          <Button size="lg" className="text-base px-8">
            Empezar gratis
          </Button>
          <Button variant="outline" size="lg" className="text-base px-8">
            Ver cómo funciona
          </Button>
        </div>

        {/* Dashboard mockup */}
        <div className="mt-14 max-w-3xl mx-auto overflow-hidden rounded-xl border border-border shadow-lg max-h-[340px] md:max-h-[400px]">
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

      {/* ── 2. EL PROBLEMA ── */}
      <section className="bg-muted py-20 px-6">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-semibold tracking-tight">
            ¿A dónde se fue tu sueldo este mes?
          </h2>
          <p className="mt-5 text-lg text-muted-foreground">
            No lo sabes porque lo decidiste después de gastarlo. Quipu invierte
            ese orden.
          </p>
        </div>
      </section>

      {/* ── 3. CÓMO FUNCIONA ── */}
      <section id="como-funciona" className="max-w-5xl mx-auto px-6 py-20">
        <h2 className="text-3xl md:text-4xl font-semibold tracking-tight text-center">
          Tres pasos. Una sola vez.
        </h2>
        <div className="mt-14 grid grid-cols-1 md:grid-cols-3 gap-10">
          {[
            {
              icon: Calendar,
              title: "Configura tu día de pago",
              desc: "Dile a Quipu cuánto ganas y cuándo cobras. Solo una vez.",
            },
            {
              icon: Layers,
              title: "Tu dinero se asigna solo",
              desc: "El día que cobras, Quipu divide tu sueldo automáticamente: 50% necesidades, 30% gustos, 20% ahorro. Sin que tengas que hacer nada.",
            },
            {
              icon: ShieldCheck,
              title: "Gasta sin culpa",
              desc: "Sabes exactamente cuánto puedes gastar en cada categoría. Sin hojas de cálculo. Sin adivinar.",
            },
          ].map((step) => (
            <div key={step.title} className="text-center space-y-4">
              <div className="mx-auto w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center">
                <step.icon className="w-7 h-7 text-primary" />
              </div>
              <h3 className="text-lg font-semibold">{step.title}</h3>
              <p className="text-muted-foreground">{step.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── 4. DIFERENCIADORES ── */}
      <section className="bg-muted py-20 px-6">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-semibold tracking-tight text-center">
            No es otra app de gastos.
          </h2>
          <div className="mt-14 grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              {
                title: "Proactivo, no reactivo",
                text: "Las otras apps te muestran el desastre después de que pasó. Quipu actúa antes.",
              },
              {
                title: "Automático de verdad",
                text: "No hay categorías que completar ni transacciones que etiquetar. Tu plan funciona solo desde el día de pago.",
              },
              {
                title: "Hecho para Perú",
                text: "Gratificaciones de julio y diciembre, CTS, Yape. Diseñado para como funciona el dinero acá.",
              },
            ].map((d) => (
              <Card key={d.title}>
                <CardContent className="space-y-3">
                  <h3 className="text-lg font-semibold">{d.title}</h3>
                  <p className="text-muted-foreground">{d.text}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* ── 5. PRUEBA SOCIAL / NÚMEROS ── */}
      <section className="bg-foreground text-background py-20 px-6">
        <div className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-12 text-center">
          {[
            { number: "S/ 1,000", label: "Ahorro promedio en el primer mes" },
            { number: "2 min", label: "Para configurar tu plan" },
            { number: "0", label: "Transacciones que categorizar manualmente" },
          ].map((stat) => (
            <div key={stat.number}>
              <p className="text-4xl md:text-5xl font-semibold">
                {stat.number}
              </p>
              <p className="mt-2 text-background/70">{stat.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── 6. FEATURES ── */}
      <section className="max-w-4xl mx-auto px-6 py-20">
        <h2 className="text-3xl md:text-4xl font-semibold tracking-tight text-center">
          Todo lo que necesitas para no volver a perder el control.
        </h2>
        <div className="mt-14 grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-5">
          {[
            "Asignación automática el día de pago",
            "Fondo de emergencia, objetivos y inversión separados",
            "Modo Rescate cuando te pasas del presupuesto",
            "Gratificaciones y CTS con plan automático",
            "Cuotas y deudas integradas a tu presupuesto real",
            "Coach financiero con alertas en el momento justo",
            "Logros y rachas para mantener la disciplina",
            "Modo pareja para gastos del hogar compartidos",
          ].map((f) => (
            <div key={f} className="flex items-start gap-3">
              <Check className="w-5 h-5 text-primary mt-0.5 shrink-0" />
              <span>{f}</span>
            </div>
          ))}
        </div>
      </section>

      {/* ── 7. PRICING ── */}
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
                  {[
                    "Asignación automática 50/30/20",
                    "3 sobres principales",
                    "Registro de gastos",
                    "Fondo de emergencia",
                    "Coach básico",
                  ].map((f) => (
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
                  {[
                    "Objetivos de ahorro ilimitados",
                    "Modo Rescate avanzado",
                    "Gratificaciones y CTS",
                    "Modo pareja",
                    "Coach con IA personalizado",
                  ].map((f) => (
                    <li key={f} className="flex items-center gap-2">
                      <Check className="w-4 h-4 text-primary shrink-0" />
                      {f}
                    </li>
                  ))}
                </ul>
                <Button className="w-full">Empezar con Premium</Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* ── 8. CTA FINAL ── */}
      <section className="bg-primary text-primary-foreground py-20 px-6">
        <div className="max-w-3xl mx-auto text-center space-y-5">
          <h2 className="text-3xl md:text-4xl font-semibold tracking-tight">
            Tu próximo día de pago puede ser diferente.
          </h2>
          <p className="text-primary-foreground/80 text-lg">
            Empieza gratis. Sin tarjeta de crédito.
          </p>
          <Button size="lg" variant="outline" className="text-gray-800">
            Crear mi cuenta gratis
          </Button>
        </div>
      </section>

      {/* ── 9. FOOTER ── */}
      <footer className="border-t border-border py-8 px-6">
        <div className="container mx-auto flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-muted-foreground">
          <span className="font-semibold text-foreground">quipu</span>
          <div className="flex items-center gap-4">
            <a href="#" className="hover:text-foreground">
              Términos
            </a>
            <span>·</span>
            <a href="#" className="hover:text-foreground">
              Privacidad
            </a>
          </div>
          <span>© {new Date().getFullYear()} Quipu. Hecho en Perú 🇵🇪</span>
        </div>
      </footer>
    </div>
  );
}
