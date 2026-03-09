import { Button } from "@/core/components/ui/button";
import Link from "next/link";

export function CTASection() {
  return (
    <section className="bg-primary text-primary-foreground py-20 px-6">
      <div className="max-w-3xl mx-auto text-center space-y-5">
        <h2 className="text-3xl md:text-4xl font-semibold tracking-tight">
          Tu próximo día de pago puede ser diferente.
        </h2>
        <p className="text-primary-foreground/80 text-lg">
          Empieza gratis. Sin tarjeta de crédito.
        </p>
        <Button size="lg" variant="outline" className="text-gray-800" asChild>
          <Link href="/register" prefetch={false}>
            Crear mi cuenta gratis
          </Link>
        </Button>
      </div>
    </section>
  );
}
