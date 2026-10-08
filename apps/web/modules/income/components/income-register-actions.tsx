import Link from "next/link";
import { Button } from "@/shared/components/ui/button";
import { buttonVariants } from "@/shared/components/ui/button-variants";
import { cn } from "@/shared/lib/utils";
import { INCOME_CANCEL_CTA } from "../constants";

type IncomeRegisterActionsProps = {
	canSubmit: boolean;
	isSubmitting: boolean;
	submitLabel: string;
};

export function IncomeRegisterActions({
	canSubmit,
	isSubmitting,
	submitLabel,
}: IncomeRegisterActionsProps) {
	const disabled = !canSubmit || isSubmitting;
	const label = isSubmitting ? "Registrando…" : submitLabel;

	return (
		<>
			<div className="mt-6 hidden flex-col-reverse gap-2.5 md:flex md:flex-row md:justify-end">
				<Link
					href="/dashboard"
					className={cn(
						buttonVariants({ variant: "outline" }),
						"inline-flex h-[46px] rounded-[11px] border-line bg-card px-[22px] text-[14.5px] font-semibold text-mute hover:bg-surface-soft",
					)}
				>
					{INCOME_CANCEL_CTA}
				</Link>
				<Button
					type="submit"
					disabled={disabled}
					className="h-[46px] rounded-[11px] bg-ink px-[26px] text-[14.5px] font-semibold text-canvas hover:bg-ink/90"
				>
					{label}
				</Button>
			</div>

			<div className="fixed inset-x-0 bottom-0 z-30 flex items-center gap-2.5 border-t border-line bg-canvas/95 px-4 pt-3 pb-[max(env(safe-area-inset-bottom),12px)] backdrop-blur-md md:hidden">
				<Link
					href="/dashboard"
					className={cn(
						buttonVariants({ variant: "outline" }),
						"inline-flex h-[44px] flex-1 rounded-[11px] border-line bg-card text-[14px] font-semibold text-mute hover:bg-surface-soft",
					)}
				>
					{INCOME_CANCEL_CTA}
				</Link>
				<Button
					type="submit"
					disabled={disabled}
					className="h-[44px] flex-1 rounded-[11px] bg-ink text-[14px] font-semibold text-canvas hover:bg-ink/90"
				>
					{label}
				</Button>
			</div>
		</>
	);
}
