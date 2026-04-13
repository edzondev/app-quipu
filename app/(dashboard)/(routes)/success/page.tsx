import { CheckCircle } from "lucide-react";
import Link from "next/link";
import { Button } from "@/core/components/ui/button";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "¡Ya eres Premium!",
  description: "Tu suscripción a Quipu Premium fue activada exitosamente.",
};

export default function SuccessPage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[80vh] px-6 text-center">
      <div className="flex flex-col items-center gap-6 max-w-md">
        <div className="flex items-center justify-center w-20 h-20 rounded-full bg-primary/10">
          <CheckCircle className="w-10 h-10 text-primary" />
        </div>

        <div className="space-y-2">
          <h1 className="text-3xl font-semibold tracking-tight">
            ¡Ya eres Premium! 🎉
          </h1>
          <p className="text-muted-foreground">
            Tu pago fue procesado exitosamente. Ahora tienes acceso a todas las
            funciones de Quipu: objetivos de ahorro ilimitados, modo pareja,
            coach con IA y mucho más.
          </p>
        </div>

        <Button asChild size="lg" className="w-full max-w-xs">
          <Link href="/dashboard">Ir al dashboard</Link>
        </Button>
      </div>
    </div>
  );
}
