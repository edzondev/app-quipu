import { Skeleton } from "@/shared/components/ui/skeleton";

/** Canon loading shell for espacios views (hub, dashboard, invite). */
export function EspaciosLoadingSkeleton() {
	return (
		<div className="mx-auto w-full max-w-2xl px-5 py-6 md:px-0 md:py-8">
			<Skeleton variant="line" className="h-3 w-24" />
			<Skeleton className="mt-4 h-9 w-56 rounded-lg" />
			<Skeleton variant="line" className="mt-2 h-4 w-full max-w-md" />
			<Skeleton className="mt-6 h-40 w-full rounded-[14px]" />
		</div>
	);
}
