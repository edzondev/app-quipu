"use client";

import { CircleCheck } from "lucide-react";
import { useRouter } from "next/navigation";
import { Button } from "@/core/components/ui/button";

export default function DoneStep() {
  const router = useRouter();

  return (
    <div className="flex flex-col h-full min-h-full items-center justify-center text-center gap-6 py-16 animate-in zoom-in-95 fade-in duration-500">
      <div className="flex items-center justify-center w-20 h-20 rounded-full bg-envelope-savings/15">
        <CircleCheck className="w-10 h-10 text-envelope-savings" />
      </div>

      <div className="space-y-2 max-w-md">
        <h1 className="text-3xl font-bold tracking-tight">¡Asignado!</h1>
        <p className="text-muted-foreground text-lg">
          Tu dinero ya sabe a dónde va.
        </p>
      </div>

      <Button
        size="lg"
        className="mt-4"
        onClick={() => router.push("/dashboard")}
      >
        Ir al dashboard
      </Button>
    </div>
  );
}
