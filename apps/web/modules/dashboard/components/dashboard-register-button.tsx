"use client";

import { Add } from "reicon-react/icons/Add";
import { REGISTER_CTA } from "@/modules/dashboard/constants";
import { useDashboardSummary } from "@/modules/dashboard/queries";
import { EXPENSE_NO_CYCLE_HINT } from "@/modules/expenses/constants";
import { useExpenseRegister } from "@/modules/expenses/hooks/use-expense-register-context";
import { Button } from "@/shared/components/ui/button";
import { buttonVariants } from "@/shared/components/ui/button-variants";
import { cn } from "@/shared/lib/utils";

type Props = {
	size?: "default" | "sm" | "icon-lg";
	showLabel?: boolean;
	variant?: "primary" | "secondary";
	className?: string;
};

export function DashboardRegisterButton({
	size = "default",
	showLabel = true,
	variant = "secondary",
	className,
}: Props) {
	const { open } = useExpenseRegister();
	const summary = useDashboardSummary();
	const hasActiveCycle = Boolean(summary?.cycle);

	return (
		<Button
			type="button"
			size={size}
			disabled={!hasActiveCycle}
			title={!hasActiveCycle ? EXPENSE_NO_CYCLE_HINT : REGISTER_CTA}
			onClick={() => open({ variant: "fab" })}
			className={cn(
				buttonVariants({
					variant: variant === "primary" ? "default" : "secondary",
					size: "sm",
				}),
				variant === "primary" && "border-transparent bg-ink text-canvas hover:bg-ink/90",
				className,
			)}
		>
			<Add size={16} color="currentColor" className="mr-2" aria-hidden />
			{showLabel ? REGISTER_CTA : null}
		</Button>
	);
}
