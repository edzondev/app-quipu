"use client";

import { cn } from "@/shared/lib/utils";
import { INCOME_SOURCE_OPTIONS } from "../constants";
import type { IncomeSource } from "../types";

type Props = {
	value: IncomeSource | null;
	onChange: (source: IncomeSource) => void;
};

export function IncomeSourceChips({ value, onChange }: Props) {
	return (
		<div className="flex flex-wrap gap-2">
			{INCOME_SOURCE_OPTIONS.map((option) => {
				const selected = value === option.value;
				return (
					<button
						key={option.value}
						type="button"
						onClick={() => onChange(option.value)}
						className={cn(
							"inline-flex items-center gap-2 rounded-[11px] border px-[15px] py-2.5 text-sm transition-colors",
							selected
								? "border-[1.5px] border-qp bg-qp-soft font-semibold text-qp-deep"
								: "border-line bg-card text-ink-secondary hover:border-line-strong",
						)}
					>
						{selected ? <span className="size-2 rounded-full bg-qp" aria-hidden /> : null}
						{option.label}
					</button>
				);
			})}
		</div>
	);
}
