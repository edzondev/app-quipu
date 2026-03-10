"use client";

import { Button } from "@/core/components/ui/button";
import { Plus } from "lucide-react";
import Link from "next/link";

type Props = {
  workerType: string;
};

export default function IncomeRegisterButton({ workerType }: Props) {
  if (workerType !== "independent") return null;

  return (
    <div className="mb-6">
      <Button variant="outline" size="sm" asChild>
        <Link href="/register-income">
          <Plus className="size-4" /> Registrar ingreso de hoy
        </Link>
      </Button>
    </div>
  );
}
