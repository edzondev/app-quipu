"use client";

import { cn } from "@/shared/lib/utils";
import { INCOME_KIND_EXTRAORDINARY, INCOME_KIND_HABITUAL } from "../constants";

type Props = {
	value: "habitual" | "extraordinary";
	onChange: (kind: "habitual" | "extraordinary") => void;
};

export function IncomeKindToggle({ value, onChange }: Props) {
	return (
		<div className="inline-flex rounded-[13px] border border-line bg-canvas-page p-1">
			{(
				[
					["habitual", INCOME_KIND_HABITUAL, "dot"] as const,
					["extraordinary", INCOME_KIND_EXTRAORDINARY, "diamond"] as const,
				] as const
			).map(([kind, label, marker]) => {
				const selected = value === kind;
				return (
					<button
						key={kind}
						type="button"
						onClick={() => onChange(kind)}
						className={cn(
							"inline-flex items-center gap-2 rounded-[10px] px-5 py-2.5 text-sm font-semibold transition-colors",
							selected && kind === "extraordinary"
								? "border border-extraordinary-border bg-card text-extraordinary-b shadow-[0_2px_6px_-3px_rgba(176,132,48,0.5)]"
								: selected
									? "bg-card text-ink"
									: "text-mute hover:text-ink-secondary",
						)}
					>
						{marker === "dot" ? (
							<span className="size-2 rounded-full bg-moss" aria-hidden />
						) : (
							<span className="size-2 rotate-45 rounded-sm bg-extraordinary-a" aria-hidden />
						)}
						{label}
					</button>
				);
			})}
		</div>
	);
}
