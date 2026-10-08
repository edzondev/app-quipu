"use client";

import { useMutation } from "convex/react";
import { useCallback } from "react";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import type { IncomeSource } from "@/modules/income/types";
import { Button } from "@/shared/components/ui/button";
import { IncomeEditForm } from "./income-edit-form";
import type { MovementForDetail } from "./movement-detail-sheet";

type Props = {
	movement: MovementForDetail;
	currencyCode: string;
	onSuccess: () => void;
	onCancel: () => void;
};

/**
 * Edición de ingreso: si faltan `source` u `occurredAt`, avisa y permite
 * volver. Si están, adapta la mutación de Convex y monta `IncomeEditForm`.
 */
export function MovementDetailEditIncome({ movement, currencyCode, onSuccess, onCancel }: Props) {
	const updateIncomeEvent = useMutation(api.incomeEvents.updateIncomeEvent);
	const handleUpdate = useCallback(
		async (args: {
			eventId: string;
			amount: number;
			source: IncomeSource;
			description: string;
			occurredAt: number;
			incomeKind?: "habitual" | "extraordinary";
		}) =>
			updateIncomeEvent({
				eventId: args.eventId as Id<"incomeEvents">,
				amount: args.amount,
				source: args.source,
				description: args.description,
				occurredAt: args.occurredAt,
				incomeKind: args.incomeKind,
			}),
		[updateIncomeEvent],
	);

	if (!movement.source || movement.occurredAt === undefined) {
		return (
			<div className="space-y-4">
				<p className="text-[13.5px] leading-relaxed text-mute" role="alert">
					No pudimos cargar los datos para editar este ingreso. Cierra y vuelve a abrir el
					movimiento; si sigue igual, recarga la página.
				</p>
				<Button
					type="button"
					variant="outline"
					onClick={onCancel}
					className="h-12 w-full rounded-[12px] border-line text-[14.5px] font-semibold text-mute"
				>
					Volver
				</Button>
			</div>
		);
	}

	return (
		<IncomeEditForm
			autoFocus
			eventId={movement.id}
			initialAmountCents={movement.amount}
			initialSource={movement.source}
			initialDescription={movement.label}
			initialOccurredAt={movement.occurredAt}
			currencyCode={currencyCode}
			updateIncomeEvent={handleUpdate}
			onSuccess={onSuccess}
			onCancel={onCancel}
		/>
	);
}
