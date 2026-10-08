"use client";

import { cn } from "@/shared/lib/utils";

type Props = {
	checked: boolean;
	onCheckedChange: (checked: boolean) => void;
	disabled?: boolean;
	label: string;
};

export function SettingsToggle({ checked, onCheckedChange, disabled, label }: Props) {
	return (
		<button
			type="button"
			role="switch"
			aria-checked={checked}
			aria-label={label}
			disabled={disabled}
			onClick={() => onCheckedChange(!checked)}
			className={cn(
				"relative h-[23px] w-10 shrink-0 rounded-full transition-colors",
				checked ? "bg-qp" : "bg-line",
				disabled && "cursor-not-allowed opacity-50",
			)}
		>
			<span
				className={cn(
					"absolute top-[2.5px] size-[18px] rounded-full bg-card transition-[left]",
					checked ? "left-[19px]" : "left-[2.5px]",
				)}
			/>
		</button>
	);
}
