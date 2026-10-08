import { ModuleLoadingShell } from "@/shared/components/layout/module-loading-shell";
import { Skeleton } from "@/shared/components/ui/skeleton";

export function CycleCorrectViewSkeleton() {
	return (
		<ModuleLoadingShell maxWidth="lg" className="px-4 md:px-4">
			<Skeleton variant="line" className="h-3 w-24" />
			<Skeleton className="mt-3 h-8 w-56 rounded-lg" />
			<Skeleton variant="line" className="mt-2 h-4 w-full max-w-md" />
			<Skeleton className="mt-6 h-48 w-full rounded-[14px]" />
			<Skeleton className="mt-4 h-32 w-full rounded-[14px] [animation-delay:150ms]" />
		</ModuleLoadingShell>
	);
}
