import { Skeleton } from "@/shared/components/ui/skeleton";
import { DashboardHeroSkeleton } from "./dashboard-hero-skeleton";
import { EnvelopeCardsSkeleton } from "./envelope-cards-skeleton";

/** Full dashboard loading state — header placeholders only, no interactive CTAs. */
export function DashboardViewSkeleton() {
	return (
		<>
			<header className="mb-4 md:mb-6">
				<div className="md:flex md:items-end md:justify-between md:gap-4">
					<div className="min-w-0">
						<Skeleton className="h-7 w-48 rounded-lg md:h-8" />
						<Skeleton variant="line" className="mt-1 h-3 w-36 [animation-delay:150ms]" />
					</div>
					<div className="hidden shrink-0 md:block">
						<Skeleton className="h-9 w-44 rounded-[11px] [animation-delay:150ms]" />
					</div>
				</div>
				<div className="mt-3 md:hidden">
					<Skeleton className="h-10 w-full rounded-[11px] [animation-delay:150ms]" />
				</div>
			</header>
			<DashboardHeroSkeleton />
			<EnvelopeCardsSkeleton />
		</>
	);
}
