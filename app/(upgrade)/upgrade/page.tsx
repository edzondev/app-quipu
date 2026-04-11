import type { Metadata } from "next";
import PlansView from "@/modules/subscription/components/plans-view";

export const metadata: Metadata = {
  title: "Planes y precios",
  description:
    "Quipu Free vs Premium. Desbloquea rescate, compromisos fijos e ingresos extraordinarios.",
  alternates: { canonical: "/upgrade" },
  openGraph: {
    title: "Planes y precios | Quipu",
    description:
      "Desbloquea todas las funciones Premium de Quipu: rescate, compromisos fijos e ingresos extraordinarios.",
    url: "/upgrade",
  },
};

export default function UpgradePage() {
  return <PlansView />;
}
