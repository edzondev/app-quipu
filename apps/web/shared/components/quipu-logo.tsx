import { cn } from "@/shared/lib/utils";

/**
 * Logo canon: tres líneas (quipu) + wordmark Geist.
 * Server-safe. Reusable en auth, sidebar y landing.
 */
export function QuipuLogo({ className }: { className?: string }) {
	return (
		<span className={cn("inline-flex items-center gap-[9px]", className)}>
			<span aria-hidden className="flex flex-col gap-[2.5px]">
				<span className="h-[2.5px] w-4 rounded-[2px] bg-qp" />
				<span className="h-[2.5px] w-[11px] rounded-[2px] bg-moss" />
				<span className="h-[2.5px] w-1.5 rounded-[2px] bg-clay" />
			</span>
			<span className="font-serif text-[19px] font-medium text-ink">Quipu</span>
		</span>
	);
}
