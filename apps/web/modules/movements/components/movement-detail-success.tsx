"use client";

import { Button } from "@/shared/components/ui/button";

type Props = {
	onClose: () => void;
};

/** Pantalla de éxito tras guardar una edición. Cuerpo del sheet. */
export function MovementDetailSuccess({ onClose }: Props) {
	return (
		<div className="flex flex-col items-center py-6 text-center">
			<div className="flex size-16 items-center justify-center rounded-full bg-qp shadow-glow">
				<svg
					viewBox="0 0 24 24"
					className="size-8 text-canvas"
					fill="none"
					stroke="currentColor"
					strokeWidth={2.5}
					strokeLinecap="round"
					strokeLinejoin="round"
					aria-hidden="true"
					role="presentation"
				>
					<polyline points="20 6 9 17 4 12" />
				</svg>
			</div>
			<p className="mt-4 font-serif text-[22px] font-medium text-ink">Listo</p>
			<p className="mt-2 text-[13.5px] leading-relaxed text-mute">
				Corregimos el registro. Tus sobres se actualizaron.
			</p>
			<Button
				type="button"
				onClick={onClose}
				className="mt-6 h-12 w-full rounded-[12px] bg-ink text-[15px] font-semibold text-canvas hover:bg-ink/90"
			>
				Cerrar
			</Button>
		</div>
	);
}
