"use client";

import { ENVELOPE_LABELS } from "@/shared/constants/envelopes";
import { formatCents } from "@/shared/lib/money";
import { cn } from "@/shared/lib/utils";
import { ESPACIOS_ENVELOPE_AVAILABLE, ESPACIOS_HUB_ENVELOPES_LABEL } from "../constants";
import type { SpaceEnvelopeType } from "./space-envelope-picker";
import { SpaceSection } from "./space-section";

type EnvelopeRow = {
	type: SpaceEnvelopeType;
	remainingAmount: number;
};

type Props = {
	envelopes: EnvelopeRow[];
	currencyCode: string;
	className?: string;
};

const ENVELOPE_DOT = {
	needs: "bg-steel",
	wants: "bg-clay",
	savings: "bg-moss",
} as const;

export function SpaceEnvelopeCards({ envelopes, currencyCode, className }: Props) {
	return (
		<SpaceSection
			title={ESPACIOS_HUB_ENVELOPES_LABEL}
			className={className}
			contentClassName="py-4"
		>
			<div className="grid gap-2 md:grid-cols-3">
				{envelopes.map((envelope) => (
					<article key={envelope.type} className="rounded-lg bg-surface-warm/50 px-3 py-3">
						<div className="flex items-center gap-2">
							<span
								className={cn("size-1.5 shrink-0 rounded-full", ENVELOPE_DOT[envelope.type])}
								aria-hidden
							/>
							<span className="text-[13px] font-medium text-ink">
								{ENVELOPE_LABELS[envelope.type]}
							</span>
						</div>
						<p className="mt-2 font-serif text-[19px] tabular-nums text-ink">
							{formatCents(Math.max(0, envelope.remainingAmount), {
								currency: currencyCode,
							})}
						</p>
						<p className="mt-0.5 text-[11px] text-mute">{ESPACIOS_ENVELOPE_AVAILABLE}</p>
					</article>
				))}
			</div>
		</SpaceSection>
	);
}
