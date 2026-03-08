"use client";

import { Button } from "@/core/components/ui/button";
import { CircleCheck } from "lucide-react";
import { useRouter } from "next/navigation";

export default function AlreadyProcessedView() {
  const router = useRouter();

  return (
    <div className="flex flex-col items-center justify-center text-center gap-6 py-16 animate-in fade-in duration-300">
      <div className="flex items-center justify-center w-20 h-20 rounded-full bg-envelope-savings/15">
        <CircleCheck className="w-10 h-10 text-envelope-savings" />
      </div>

      <div className="space-y-2 max-w-md">
        <h1 className="text-3xl font-bold tracking-tight">
          Ya asignaste tu ingreso este período
        </h1>
        <p className="text-muted-foreground text-lg">
          Tu dinero ya fue distribuido a tus sobres. Puedes revisar tus saldos
          desde el dashboard en cualquier momento.
        </p>
      </div>

      <Button
        size="lg"
        className="mt-4"
        onClick={() => router.push("/dashboard")}
      >
        Ver dashboard
      </Button>
    </div>
  );
}
