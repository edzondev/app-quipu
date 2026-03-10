import { Crown } from "lucide-react";
import { cn } from "@/lib/utils";

type Props = {
  className?: string;
  size?: "sm" | "md";
};

/**
 * Small crown badge that signals a feature requires Premium.
 * Drop it next to any label, card title, or nav item.
 */
export function PremiumBadge({ className, size = "sm" }: Props) {
  return (
    <Crown
      className={cn(
        "inline-block text-amber-400 shrink-0",
        size === "sm" ? "w-3.5 h-3.5" : "w-4 h-4",
        className,
      )}
      aria-label="Función Premium"
    />
  );
}
