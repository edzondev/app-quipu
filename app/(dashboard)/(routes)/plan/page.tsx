import PlanView from "@/modules/plan/components/plan-view";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Mi Plan",
  description:
    "Revisa tu plan de suscripción actual y accede a las funciones Premium de Quipu.",
};

export default function PlanPage() {
  return <PlanView />;
}
