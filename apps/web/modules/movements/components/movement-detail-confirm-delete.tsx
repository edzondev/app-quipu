"use client";

import Link from "next/link";
import { AnalyticsEvents, track } from "@/core/analytics";
import { Button } from "@/shared/components/ui/button";

type Props = {
	isIncome: boolean;
	isDeleting: boolean;
	deleteError: string | null;
	onCancel: () => void;
	onConfirm: () => void;
	onCloseSheet: () => void;
};

/** Confirmación de borrado con copy contextual (ingreso vs gasto). */
export function MovementDetailConfirmDelete({
	isIncome,
	isDeleting,
	deleteError,
	onCancel,
	onConfirm,
	onCloseSheet,
}: Props) {
	return (
		<div className="space-y-4">
			<div className="rounded-[13px] border border-danger-line bg-danger-bg px-4 py-4">
				<p className="text-[13.5px] font-semibold text-danger-ink">
					¿Eliminar {isIncome ? "este ingreso" : "este gasto"}?
				</p>
				<p className="mt-1 text-[13px] leading-relaxed text-danger-text">
					{isIncome
						? "Eliminar borra el registro del ciclo activo y ajusta sobres. Si el problema es que registraste dinero reservado o ya ahorrado, es mejor corregir la distribución sin borrar historial."
						: "Esta acción no se puede deshacer. Los sobres de tu ciclo se recalcularán automáticamente."}
				</p>
			</div>
			{isIncome ? (
				<Link
					href="/cycle/correct"
					className="block rounded-[12px] border border-qp-shield-line bg-qp-panel px-4 py-3 text-[13px] font-semibold text-qp-deep"
					onClick={() => {
						track(AnalyticsEvents.ALLOCATION_CORRECT_CTA_CLICKED, {
							source: "delete_income",
						});
						onCloseSheet();
					}}
				>
					Preferible: corregir distribución del ciclo
				</Link>
			) : null}
			{deleteError ? (
				<p className="text-sm text-danger" role="alert">
					{deleteError}
				</p>
			) : null}
			<div className="flex gap-2.5">
				<Button
					type="button"
					variant="outline"
					disabled={isDeleting}
					onClick={onCancel}
					className="h-12 flex-1 rounded-[12px] border-line text-[14.5px] font-semibold text-mute"
				>
					Cancelar
				</Button>
				<Button
					type="button"
					disabled={isDeleting}
					onClick={onConfirm}
					className="h-12 flex-1 rounded-[12px] bg-[#B0685A] text-[15px] font-semibold text-[#FBFAF7] hover:bg-[#9A5347]"
				>
					{isDeleting ? "Eliminando…" : "Eliminar"}
				</Button>
			</div>
		</div>
	);
}
