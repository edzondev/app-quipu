"use client";

import type { z } from "zod";
import { cn } from "@/shared/lib/utils";
import {
	ESPACIOS_SETTINGS_EFFECTIVE_CURRENT,
	ESPACIOS_SETTINGS_EFFECTIVE_CURRENT_HINT,
	ESPACIOS_SETTINGS_EFFECTIVE_NEXT,
} from "../constants";
import type { effectiveOnSchema } from "../schemas";

export type SpaceEffectiveOn = z.infer<typeof effectiveOnSchema>;

type Props = {
	value: SpaceEffectiveOn;
	onChange: (value: SpaceEffectiveOn) => void;
	disabled?: boolean;
	showCurrentCycleOption: boolean;
};

export function SpaceEffectiveOnSelector({
	value,
	onChange,
	disabled,
	showCurrentCycleOption,
}: Props) {
	if (!showCurrentCycleOption) return null;

	return (
		<div className="mt-4 space-y-2">
			<p className="text-[12.5px] font-medium text-ink-secondary">Cuándo aplicar</p>
			<div className="flex gap-2">
				{(
					[
						{
							id: "next_cycle" as const,
							label: ESPACIOS_SETTINGS_EFFECTIVE_NEXT,
						},
						{
							id: "current_cycle" as const,
							label: ESPACIOS_SETTINGS_EFFECTIVE_CURRENT,
						},
					] as const
				).map((option) => {
					const selected = value === option.id;
					return (
						<button
							key={option.id}
							type="button"
							disabled={disabled}
							aria-pressed={selected}
							onClick={() => onChange(option.id)}
							className={cn(
								"flex-1 rounded-xl border px-3 py-2.5 text-left text-sm transition-colors",
								selected
									? "border-qp bg-qp-soft text-ink"
									: "border-line bg-card text-body-secondary hover:bg-surface-warm",
								disabled && "cursor-not-allowed opacity-60",
							)}
						>
							{option.label}
						</button>
					);
				})}
			</div>
			{value === "current_cycle" ? (
				<p className="text-[12px] leading-relaxed text-mute">
					{ESPACIOS_SETTINGS_EFFECTIVE_CURRENT_HINT}
				</p>
			) : null}
		</div>
	);
}
