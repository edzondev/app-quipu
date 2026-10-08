"use client";

import { Backspace } from "reicon-react/icons/Backspace";
import { Button } from "@/shared/components/ui/button";
import { cn } from "@/shared/lib/utils";
import { appendKeypadDigit, backspaceKeypad } from "../lib/keypad";

const KEYS = ["1", "2", "3", "4", "5", "6", "7", "8", "9", ".", "0", "⌫"] as const;

type Props = {
	amountCents: number;
	onChange: (cents: number) => void;
	className?: string;
};

export function ExpenseKeypad({ amountCents, onChange, className }: Props) {
	function handleKey(key: (typeof KEYS)[number]) {
		if (key === "⌫") {
			onChange(backspaceKeypad(amountCents));
			return;
		}
		if (key === ".") {
			return;
		}
		onChange(appendKeypadDigit(amountCents, Number(key)));
	}

	return (
		<div className={cn("grid grid-cols-3 gap-2", className)}>
			{KEYS.map((key) => {
				const isAction = key === "." || key === "⌫";
				return (
					<Button
						key={key}
						type="button"
						variant="ghost"
						onClick={() => handleKey(key)}
						className={cn(
							"h-12 rounded-[11px] font-serif text-[21px] text-ink",
							isAction
								? "bg-transparent hover:bg-surface-warm"
								: "border border-line bg-surface-soft hover:bg-surface-warm",
							key === "." && "text-mute",
							key === "⌫" && "text-[18px] text-mute",
						)}
					>
						{key === "⌫" ? <Backspace size={20} color="currentColor" className="text-mute" /> : key}
					</Button>
				);
			})}
		</div>
	);
}
