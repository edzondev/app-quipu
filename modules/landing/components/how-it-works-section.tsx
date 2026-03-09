import { Calendar, Layers, ShieldCheck } from "lucide-react";

const STEPS = [
  {
    icon: Calendar,
    title: "Configura tu día de pago",
    desc: "Dile a Quipu cuánto ganas y cuándo cobras. Solo una vez.",
  },
  {
    icon: Layers,
    title: "Tu dinero se asigna solo",
    desc: "El día que cobras, confirmas tu ingreso y Quipu asigna todo en sobres: 50% necesidades, 30% gustos, 20% ahorro. Sin conectar tu banco, sin complicaciones.",
  },
  {
    icon: ShieldCheck,
    title: "Gasta sin culpa",
    desc: "Sabes exactamente cuánto puedes gastar en cada categoría. Sin hojas de cálculo. Sin adivinar.",
  },
];

export default function HowItWorksSection() {
  return (
    <section id="como-funciona" className="max-w-5xl mx-auto px-6 py-20">
      <h2 className="text-3xl md:text-4xl font-semibold tracking-tight text-center">
        Tres pasos. Una sola vez.
      </h2>
      <div className="mt-14 grid grid-cols-1 md:grid-cols-3 gap-10">
        {STEPS.map((step) => (
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
  );
}
