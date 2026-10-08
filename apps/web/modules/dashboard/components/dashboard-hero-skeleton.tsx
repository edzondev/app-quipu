import { Skeleton } from "@/shared/components/ui/skeleton";

/** Canon bloque 3 "Cargando": hero como bloque plano único. */
export function DashboardHeroSkeleton() {
	return (
		<Skeleton
			role="status"
			aria-label="Cargando disponible hoy"
			className="h-33 w-full rounded-xl [animation-delay:150ms]"
		/>
	);
}
