import { Check } from "lucide-react";

const FEATURES = [
  "Asignación automática el día de pago",
  "Fondo de emergencia, objetivos e inversión separados",
  "Modo Rescate cuando te pasas del presupuesto",
  "Gratificaciones y CTS con plan automático",
  "Cuotas y deudas integradas a tu presupuesto real",
  "Coach financiero con alertas en el momento justo",
  "Logros y rachas para mantener la disciplina",
  "Modo pareja para gastos del hogar compartidos",
];

export default function FeaturesSection() {
  return (
    <section className="max-w-4xl mx-auto px-6 py-20">
      <h2 className="text-3xl md:text-4xl font-semibold tracking-tight text-center">
        Todo lo que necesitas para no volver a perder el control.
      </h2>
      <div className="mt-14 grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-5">
        {FEATURES.map((f) => (
          <div key={f} className="flex items-start gap-3">
            <Check className="w-5 h-5 text-primary mt-0.5 shrink-0" />
            <span>{f}</span>
          </div>
        ))}
      </div>
    </section>
  );
}
