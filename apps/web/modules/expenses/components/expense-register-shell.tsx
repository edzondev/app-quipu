"use client";

import type { ReactNode } from "react";
import { Dialog, DialogContent, DialogTitle } from "@/shared/components/ui/dialog";
import { Sheet, SheetContent, SheetTitle } from "@/shared/components/ui/sheet";
import { useIsMobile } from "@/shared/hooks/use-mobile";
import { cn } from "@/shared/lib/utils";

type Props = {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	title: string;
	children: ReactNode;
	progress?: ReactNode;
};

const FLOW_PROGRESS_STEPS = ["amount", "envelope", "success"] as const;

export function ExpenseRegisterShell({ open, onOpenChange, title, children, progress }: Props) {
	const isMobile = useIsMobile();

	if (isMobile) {
		return (
			<Sheet open={open} onOpenChange={onOpenChange}>
				<SheetContent
					side="bottom"
					className="flex max-h-[92dvh] flex-col gap-0 overflow-hidden rounded-t-[24px] border-line bg-card px-5 pb-0 pt-3"
				>
					<div className="mx-auto mb-4 h-1 w-10 shrink-0 rounded-full bg-line" />
					<div className="mb-4 flex shrink-0 items-center justify-between gap-3 pr-8">
						<SheetTitle className="text-[15px] font-semibold text-ink">{title}</SheetTitle>
						{progress}
					</div>
					<div className="min-h-0 flex-1 overflow-y-auto overscroll-contain pb-[max(env(safe-area-inset-bottom),20px)]">
						{children}
					</div>
				</SheetContent>
			</Sheet>
		);
	}

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="max-w-[400px] gap-0 rounded-[22px] p-0">
				<div className="flex items-center justify-between px-5 pt-5">
					<DialogTitle className="text-[15px] font-semibold text-ink">{title}</DialogTitle>
					{progress}
				</div>
				<div className="px-5 pb-5 pt-4">{children}</div>
			</DialogContent>
		</Dialog>
	);
}

function FlowProgress({ step }: { step: "amount" | "envelope" | "success" }) {
	const activeIndex = FLOW_PROGRESS_STEPS.indexOf(step);

	return (
		<div className="flex items-center gap-1" aria-hidden>
			{FLOW_PROGRESS_STEPS.map((item, index) => (
				<span
					key={item}
					className={cn("h-1 w-5.5 rounded-sm", index <= activeIndex ? "bg-ink" : "bg-line")}
				/>
			))}
		</div>
	);
}

export { FlowProgress };
