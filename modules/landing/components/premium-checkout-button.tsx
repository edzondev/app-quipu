"use client";

import { Button } from "@/core/components/ui/button";
import { authClient } from "@/lib/auth-client";
import { api } from "@/convex/_generated/api";
import { useAction } from "convex/react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

export default function PremiumCheckoutButton() {
  const [loading, setLoading] = useState(false);
  const createPremiumCheckout = useAction(api.polar.createPremiumCheckout);
  const router = useRouter();
  const { data: session } = authClient.useSession();

  const handleCheckout = async () => {
    if (!session?.user) {
      router.push("/login");
      return;
    }

    setLoading(true);
    try {
      const url = await createPremiumCheckout({
        origin: window.location.origin,
        successUrl: `${window.location.origin}/success`,
      });
      window.location.href = url;
    } catch {
      toast.error("No se pudo iniciar el pago. Intenta de nuevo.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button className="w-full" onClick={handleCheckout} disabled={loading}>
      {loading ? "Cargando..." : "Empezar con Premium"}
    </Button>
  );
}
