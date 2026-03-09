import { Card, CardContent } from "@/core/components/ui/card";

const DIFFERENTIATORS = [
  {
    title: "Proactivo, no reactivo",
    text: "Las otras apps te muestran el desastre después de que pasó. Quipu actúa antes.",
  },
  {
    title: "Automático de verdad",
    text: "Sin conexión bancaria. Sin categorías que etiquetar. Registras tus gastos en segundos y Quipu te dice exactamente cuánto te queda.",
  },
  {
    title: "Hecho para Perú",
    text: "Gratificaciones de julio y diciembre, CTS, Yape. Diseñado para como funciona el dinero acá.",
  },
];

export default function DifferentiatorsSection() {
  return (
    <section className="bg-muted py-20 px-6">
      <div className="max-w-5xl mx-auto">
        <h2 className="text-3xl md:text-4xl font-semibold tracking-tight text-center">
          No es otra app de gastos.
        </h2>
        <div className="mt-14 grid grid-cols-1 md:grid-cols-3 gap-6">
          {DIFFERENTIATORS.map((d) => (
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
  );
}
