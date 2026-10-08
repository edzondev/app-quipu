import { QuipuLogo } from "@/shared/components/quipu-logo";

/**
 * Panel lateral de sign-in (solo desktop).
 * Sin la cifra "Disponible hoy S/ 82.50" del mock: el usuario aún no está
 * autenticado y mostrar un número ficticio sería mentir. Saludo + tríada.
 */
export function AuthSidePanel() {
	return (
		<aside className="hidden w-[400px] flex-col border-line border-r p-10 lg:flex bg-[linear-gradient(160deg,var(--qp-panel),var(--qp-soft))]">
			<QuipuLogo />
			<div className="flex flex-1 flex-col justify-center">
				<h2 className="font-serif font-medium text-[32px] text-ink leading-[1.15]">
					Bienvenido
					<br />
					de vuelta.
				</h2>
				<p className="mt-3 max-w-[280px] text-[14.5px] text-qp-text leading-[1.55]">
					Tu ciclo te esperó. Todo sigue en orden.
				</p>
			</div>
			<div className="flex items-center gap-6 text-[13.5px] text-body">
				<span className="inline-flex items-center gap-2">
					<span aria-hidden className="size-1.5 rounded-full bg-qp" />
					Tranquilidad
				</span>
				<span className="inline-flex items-center gap-2">
					<span aria-hidden className="size-1.5 rounded-full bg-moss" />
					Control
				</span>
				<span className="inline-flex items-center gap-2">
					<span aria-hidden className="size-1.5 rounded-full bg-clay" />
					Buen camino
				</span>
			</div>
		</aside>
	);
}
