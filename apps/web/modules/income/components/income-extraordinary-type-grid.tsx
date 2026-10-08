"use client";

import { Check } from "reicon-react/icons/Check";
import { Button } from "@/shared/components/ui/button";
import type { ExtraordinaryType } from "@/shared/lib/extraordinaryIncome";
import { cn } from "@/shared/lib/utils";
import {
	EXTRAORDINARY_TYPE_CARDS,
	INCOME_EXTRAORDINARY_CONTINUE_CTA,
	INCOME_EXTRAORDINARY_PICK_HINT,
} from "../constants";

type Props = {
	value: ExtraordinaryType | undefined;
	onChange: (type: ExtraordinaryType) => void;
	error?: string;
	showContinue?: boolean;
	onContinue?: () => void;
};

function TypeCardIcon({ type }: { type: ExtraordinaryType }) {
	if (type === "custom") {
		return (
			<span className="relative size-3.5" aria-hidden>
				<span className="absolute top-1.5 left-0 h-0.5 w-3.5 rounded-full bg-extraordinary-a" />
				<span className="absolute top-0 left-1.5 h-3.5 w-0.5 rounded-full bg-extraordinary-a" />
			</span>
		);
	}
	if (type === "cts") {
		return (
			<span
				className="h-[11px] w-[15px] rounded-[3px] border-2 border-extraordinary-a"
				aria-hidden
			/>
		);
	}
	if (type === "profit_sharing") {
		return (
			<span className="flex gap-0.5" aria-hidden>
				<span className="h-3 w-0.5 rounded-sm bg-extraordinary-a" />
				<span className="h-3 w-0.5 rounded-sm bg-extraordinary-a" />
				<span className="h-3 w-0.5 rounded-sm bg-extraordinary-a" />
			</span>
		);
	}
	if (type === "corporate_bonus") {
		return <span className="size-3 rounded-full border-2 border-extraordinary-a" aria-hidden />;
	}
	if (type === "gratification_december") {
		return (
			<span
				className="size-3 rotate-45 rounded-[3px] border-2 border-extraordinary-a bg-transparent"
				aria-hidden
			/>
		);
	}
	if (type === "gratification_july") {
		return <span className="size-3 rotate-45 rounded-[3px] bg-extraordinary-a" aria-hidden />;
	}
	return <span className="size-3 rotate-45 rounded-[3px] bg-extraordinary-a" aria-hidden />;
}

export function IncomeExtraordinaryTypeGrid({
	value,
	onChange,
	error,
	showContinue = false,
	onContinue,
}: Props) {
	return (
		<div>
			<div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
				{EXTRAORDINARY_TYPE_CARDS.map((card) => {
					const selected = value === card.type;
					return (
						<button
							key={card.type}
							type="button"
							onClick={() => onChange(card.type)}
							className={cn(
								"relative rounded-[14px] px-[18px] py-[17px] text-left transition-colors",
								card.dashed
									? "border border-dashed border-extraordinary-dashed-border bg-extraordinary-dashed-bg"
									: "border border-line bg-card",
								selected && "border-[1.5px] border-extraordinary-a bg-extraordinary-surface/50",
							)}
						>
							{selected ? (
								<span
									className="absolute top-3.5 right-3.5 flex size-[18px] items-center justify-center rounded-full bg-extraordinary-a"
									aria-hidden
								>
									<Check size={10} color="#fff" strokeWidth={3} />
								</span>
							) : null}
							<span className="mb-3 flex size-[34px] items-center justify-center rounded-[10px] bg-extraordinary-icon-bg">
								<TypeCardIcon type={card.type} />
							</span>
							<div className="font-semibold text-[15px] text-ink">{card.title}</div>
							<div className="mt-0.5 text-xs text-mute">{card.subtitle}</div>
						</button>
					);
				})}
			</div>
			{error ? (
				<p className="mt-2 text-sm text-danger" role="alert">
					{error}
				</p>
			) : null}
			{showContinue ? (
				<div className="mt-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
					<p className="text-[12.5px] text-mute">{INCOME_EXTRAORDINARY_PICK_HINT}</p>
					<Button
						type="button"
						className="h-auto shrink-0 rounded-[11px] px-6 py-3.5 text-[14.5px] font-semibold"
						disabled={!value}
						onClick={onContinue}
					>
						{INCOME_EXTRAORDINARY_CONTINUE_CTA}
					</Button>
				</div>
			) : null}
		</div>
	);
}
