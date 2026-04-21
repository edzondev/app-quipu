import { cn } from "@/lib/utils";
import Image from "next/image";

export default function StepWelcome() {
  return (
    <div className="space-y-8">
      <div className="text-center space-y-3">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary/5 mb-2">
          <Image
            src="/quipu-logo.webp"
            alt="Quipu Logo"
            width={48}
            height={48}
          />
        </div>
        <h1 className="text-3xl font-bold tracking-tight">
          Bienvenido a Quipu
        </h1>
        <p className="text-muted-foreground text-base leading-relaxed">
          En 3 pasos tendrás tu plan financiero listo.
        </p>
        <p className="text-muted-foreground text-sm leading-relaxed">
          Quipu no se conecta a tu banco. Tú registras tus gastos y la app te
          dice cuánto puedes gastar en cada sobre.
        </p>
      </div>

      <div className="grid grid-cols-3 gap-3">
        {[
          {
            icon: "🏠",
            label: "Necesidades",
            pct: "50%",
            color: "border-envelope-needs",
            textColor: "text-envelope-needs",
          },
          {
            icon: "🎉",
            label: "Gustos",
            pct: "30%",
            color: "border-envelope-wants",
            textColor: "text-envelope-wants",
          },
          {
            icon: "💰",
            label: "Ahorro",
            pct: "20%",
            color: "border-envelope-savings",
            textColor: "text-envelope-savings",
          },
        ].map((item) => (
          <div
            key={item.label}
            className={cn("rounded-xl border-2", item.color, "bg-card p-4 text-center space-y-1.5")}
          >
            <div className="text-2xl">{item.icon}</div>
            <div className="text-xs font-medium text-muted-foreground">
              {item.label}
            </div>
            <div className={cn("text-lg font-bold", item.textColor)}>
              {item.pct}
            </div>
          </div>
        ))}
      </div>

      <p className="text-center text-sm text-muted-foreground">
        Tu dinero se divide automáticamente el día de pago.
        <br />
        Sin categorizar, sin complicaciones.
      </p>
    </div>
  );
}
