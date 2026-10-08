"use client";

import { ENVELOPE_LABELS } from "@/shared/constants/envelopes";
import { formatCents } from "@/shared/lib/money";

const ALL_ENVELOPE_TYPES = ["needs", "wants", "savings"] as const;
const EXPENSE_ENVELOPE_TYPES = ["needs", "wants"] as const;

export type SpaceEnvelopeType = (typeof ALL_ENVELOPE_TYPES)[number];

type Props = {
	label: string;
	value: SpaceEnvelopeType;
	onChange: (value: SpaceEnvelopeType) => void;
	/** Gastos compartidos: solo Necesidades y Gustos (igual que personal). */
	mode?: "all" | "expense";
	balances?: Partial<Record<SpaceEnvelopeType, number>>;
	currencyCode?: string;
};

export function SpaceEnvelopePicker({
	label,
	value,
	onChange,
	mode = "all",
	balances,
	currencyCode,
}: Props) {
	const envelopeTypes = mode === "expense" ? EXPENSE_ENVELOPE_TYPES : ALL_ENVELOPE_TYPES;

	return (
		<div className="mt-3">
			<p className="font-mono text-[10px] uppercase tracking-[0.08em] text-faint">{label}</p>
			<div className="mt-2 flex flex-wrap gap-2">
				{envelopeTypes.map((type) => (
					<button
						key={type}
						type="button"
						className={`rounded-[11px] border px-3 py-2 text-xs ${
							value === type ? "border-qp bg-qp/10 text-qp-deep" : "border-line text-mute"
						}`}
						onClick={() => onChange(type)}
					>
						{ENVELOPE_LABELS[type]}
						{balances?.[type] !== undefined && currencyCode ? (
							<span className="ml-1 opacity-70">
								·{" "}
								{formatCents(Math.max(0, balances[type] ?? 0), {
									currency: currencyCode,
								})}
							</span>
						) : null}
					</button>
				))}
			</div>
		</div>
	);
}
