"use client";

import { Button } from "@/shared/components/ui/button";
import { formatCents } from "@/shared/lib/money";
import { ASSIGN_CARD_CTA, ASSIGN_CARD_TITLE } from "../constants";

type Props = {
	availableCents: number;
	currencyCode: string;
	onOpen: () => void;
};

export function AssignSavingsCard({ availableCents, currencyCode, onOpen }: Props) {
	return (
		<section className="rounded-xl border border-qp-shield-line bg-qp-selected p-4 md:p-5">
			<p className="text-[13.5px] font-medium text-qp-deep">{ASSIGN_CARD_TITLE}</p>
			<p className="mt-1 text-[12.5px] text-mute-subtle">
				Tienes {formatCents(availableCents, { currency: currencyCode })} sin asignar en tu ahorro
				del ciclo.
			</p>
			<Button type="button" className="mt-3" onClick={onOpen}>
				{ASSIGN_CARD_CTA}
			</Button>
		</section>
	);
}
