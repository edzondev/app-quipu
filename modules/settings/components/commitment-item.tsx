"use client";

import { Badge } from "@/core/components/ui/badge";
import { Button } from "@/core/components/ui/button";
import { Trash2 } from "lucide-react";

type Props = {
  id: string;
  name: string;
  amount: number;
  envelope: "needs" | "wants";
  currencySymbol: string;
  onDelete: (id: string) => void;
};

export function CommitmentItem({
  id,
  name,
  amount,
  envelope,
  currencySymbol,
  onDelete,
}: Props) {
  return (
    <div className="flex items-center justify-between py-2">
      <div className="flex items-center gap-3">
        <div>
          <p className="text-sm font-medium">{name}</p>
          <p className="text-muted-foreground text-xs">
            {currencySymbol} {amount.toLocaleString()}
          </p>
        </div>
        <Badge variant={envelope === "needs" ? "default" : "secondary"}>
          {envelope === "needs" ? "Necesidades" : "Gustos"}
        </Badge>
      </div>
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className="text-destructive hover:text-destructive h-8 w-8"
        onClick={() => onDelete(id)}
      >
        <Trash2 className="h-4 w-4" />
      </Button>
    </div>
  );
}
