"use client";

import { useState } from "react";
import type { EnvelopeKey } from "@/shared/constants/envelopes";
import { cn } from "@/shared/lib/utils";
import { type Allocation, distributeEnvelope } from "../lib/allocation";

type Props = {
	envKey: EnvelopeKey;
	label: string;
	desc: string;
	barColor: string;
	value: number;
	state: Allocation;
	dispatch: (payload: Partial<Allocation>) => void;
};

export function AllocationRow({ envKey, label, desc, barColor, value, state, dispatch }: Props) {
	const [draft, setDraft] = useState(String(value));

	function commit(raw: string) {
		const n = Number.parseInt(raw, 10);
		if (Number.isNaN(n)) {
			setDraft(String(value));
			return;
		}
		const next = distributeEnvelope(state, envKey, n);
		dispatch(next);
		setDraft(String(next[envKey]));
	}

	function adjust(delta: number) {
		const next = distributeEnvelope(state, envKey, value + delta);
		dispatch(next);
		setDraft(String(next[envKey]));
	}

	return (
		<div className="flex items-center gap-4">
			<span className={cn("size-3 shrink-0 rounded-full", barColor)} />
			<div className="flex-1">
				<p className="font-semibold">{label}</p>
				<p className="text-xs text-muted-foreground">{desc}</p>
			</div>
			<div className="flex items-center gap-1.5 rounded-lg border border-border p-1">
				<button
					type="button"
					onClick={() => adjust(-5)}
					className="flex size-7 items-center justify-center rounded-md bg-surface text-muted-foreground hover:text-foreground"
					aria-label={`Reducir ${label}`}
				>
					−
				</button>
				<input
					type="number"
					inputMode="numeric"
					aria-label={`Porcentaje de ${label}`}
					value={draft}
					onChange={(e) => setDraft(e.target.value)}
					onBlur={(e) => commit(e.target.value)}
					onKeyDown={(e) => {
						if (e.key === "Enter") commit(draft);
					}}
					min={0}
					max={100}
					className="w-12 border-none bg-transparent p-0 text-center font-serif text-lg text-foreground [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none focus:outline-none"
				/>
				<button
					type="button"
					onClick={() => adjust(5)}
					className="flex size-7 items-center justify-center rounded-md bg-surface text-muted-foreground hover:text-foreground"
					aria-label={`Aumentar ${label}`}
				>
					+
				</button>
			</div>
		</div>
	);
}
