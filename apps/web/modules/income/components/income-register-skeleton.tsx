import { AppPageShell } from "@/shared/components/layout/app-page-shell";
import { Skeleton } from "@/shared/components/ui/skeleton";

/**
 * Canon bloque 5 "Cargando": formulario a la izquierda (monto, fuente,
 * fecha), panel de impacto a la derecha y acciones al final.
 */
export function IncomeRegisterSkeleton() {
	return (
		<AppPageShell maxWidth="2xl" breadcrumbs="auto">
			<div role="status" aria-label="Preparando el ingreso">
				<Skeleton className="h-7 w-55 rounded-lg" />
				<Skeleton variant="line" className="mt-2 h-[13px] w-[300px] max-w-full rounded-[5px]" />

				<div className="mt-7 grid gap-6 xl:grid-cols-[1fr_min(320px,100%)] xl:gap-7">
					<div className="flex flex-col gap-4">
						<Skeleton variant="line" className="h-3 w-[130px] rounded-[5px]" />
						<Skeleton className="h-16 rounded-[14px]" />
						<Skeleton variant="line" className="h-3 w-27.5 rounded-[5px] [animation-delay:150ms]" />
						<div className="flex flex-wrap gap-2.25">
							<Skeleton className="h-10 w-27.5 rounded-[11px]" />
							<Skeleton className="h-10 w-[130px] rounded-[11px] [animation-delay:150ms]" />
							<Skeleton className="h-10 w-[90px] rounded-[11px] [animation-delay:300ms]" />
							<Skeleton className="h-10 w-[100px] rounded-[11px] [animation-delay:150ms]" />
						</div>
						<Skeleton variant="line" className="h-3 w-20 rounded-[5px] [animation-delay:300ms]" />
						<Skeleton className="h-[46px] w-55 max-w-full rounded-[11px]" />
					</div>
					<Skeleton className="h-48 rounded-2xl [animation-delay:150ms] xl:h-[296px]" />
				</div>

				<div className="mt-7 flex justify-end gap-2.5">
					<Skeleton className="h-[46px] w-27.5 rounded-[11px]" />
					<Skeleton className="h-[46px] w-[160px] rounded-[11px] [animation-delay:150ms]" />
				</div>
			</div>
		</AppPageShell>
	);
}
