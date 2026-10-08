"use client";

import { Edit } from "reicon-react/icons/Edit";
import { Trash } from "reicon-react/icons/Trash";
import { Button } from "@/shared/components/ui/button";
import { ENVELOPE_LABELS } from "@/shared/constants/envelopes";
import { formatLimaDateTime } from "@/shared/lib/date";
import { formatCents } from "@/shared/lib/money";
import {
	movementAmountClassName,
	movementAmountPrefix,
} from "@/shared/lib/movement-amount-display";
import type { MovementForDetail } from "./movement-detail-sheet";

type EnvelopeType = "needs" | "wants";

const ENVELOPE_DOT: Record<EnvelopeType, string> = {
	needs: "bg-steel",
	wants: "bg-clay",
};

type Props = {
	movement: MovementForDetail;
	currencyCode: string;
	onEdit: () => void;
	onRequestDelete: () => void;
};

/** Vista por defecto: cabecera con label/monto y CTAs Editar/Eliminar. */
export function MovementDetailCard({ movement, currencyCode, onEdit, onRequestDelete }: Props) {
	const isIncome = movement.kind === "income";
	const isContribution = movement.kind === "contribution";

	const displayTimestamp =
		movement.kind === "income" ? (movement.occurredAt ?? movement.timestamp) : movement.timestamp;
	const envelopeType = movement.kind === "expense" ? movement.envelopeType : undefined;
	const kindLabel = isContribution ? "Aporte" : isIncome ? "Ingreso" : "Gasto";

	return (
		<div className="space-y-5">
			<div className="rounded-xl border border-line/70 bg-surface-warm/40 px-4 py-4">
				<div className="flex items-start justify-between gap-3">
					<div className="min-w-0 flex-1">
						<p className="text-[12.5px] font-medium text-ink-secondary">
							{kindLabel}
							{envelopeType ? ` · ${ENVELOPE_LABELS[envelopeType]}` : ""}
						</p>
						<p className="mt-0.5 text-[15px] font-semibold text-ink">{movement.label}</p>
						<p className="mt-1 text-[12px] text-mute">{formatLimaDateTime(displayTimestamp)}</p>
					</div>
					<div className="flex flex-col items-end gap-1">
						<span
							className={`font-serif text-[20px] font-medium ${movementAmountClassName(movement.kind)}`}
						>
							{movementAmountPrefix(movement.kind)}{" "}
							{formatCents(movement.amount, { currency: currencyCode })}
						</span>
						{envelopeType ? (
							<span className={`size-2.5 rounded-full ${ENVELOPE_DOT[envelopeType]}`} aria-hidden />
						) : null}
					</div>
				</div>
			</div>

			{isContribution ? (
				<p className="text-[13px] leading-relaxed text-mute">
					Los aportes al espacio compartido se registran desde Espacios.
				</p>
			) : (
				<>
					<p className="text-center font-serif text-[18px] text-ink">
						¿Qué corregimos de este movimiento?
					</p>

					<div className="space-y-2.5">
						<Button
							type="button"
							onClick={onEdit}
							className="flex h-12 w-full items-center justify-center gap-2 rounded-[12px] bg-ink text-[15px] font-semibold text-canvas hover:bg-ink/90"
						>
							<Edit size={16} color="currentColor" aria-hidden />
							Editar
						</Button>
						<Button
							type="button"
							variant="outline"
							onClick={onRequestDelete}
							className="flex h-12 w-full items-center justify-center gap-2 rounded-[12px] border-danger-line text-[14.5px] font-semibold text-danger-ink hover:bg-danger-bg"
						>
							<Trash size={16} color="currentColor" aria-hidden />
							Eliminar
						</Button>
					</div>
				</>
			)}
		</div>
	);
}
