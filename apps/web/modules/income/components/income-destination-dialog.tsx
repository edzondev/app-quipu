"use client";

import { useState } from "react";
import { ArrowLeft } from "reicon-react/icons/ArrowLeft";
import { Button } from "@/shared/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/shared/components/ui/dialog";
import type { DistributionPolicy } from "@/shared/lib/allocations";
import type { ExtraordinaryType } from "@/shared/lib/extraordinaryIncome";
import { formatCents } from "@/shared/lib/money";
import { cn } from "@/shared/lib/utils";
import {
	extraordinaryTypeDisplayTitle,
	INCOME_DESTINATION_DIALOG_BACK,
	INCOME_DESTINATION_DIALOG_CONFIRM,
	INCOME_DESTINATION_DIALOG_NOTE,
} from "../constants";
import type { ImpactPreviewResult } from "../lib/impactPreview";

type Props = {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	extraordinaryType: ExtraordinaryType;
	amountCents: number;
	currencyCode: string;
	preview: ImpactPreviewResult | null;
	value: DistributionPolicy | undefined;
	onConfirm: (policy: DistributionPolicy) => void;
};

const OPTIONS: ReadonlyArray<{
	value: DistributionPolicy;
	title: string;
	recommended?: boolean;
}> = [
	{
		value: "profile_default",
		title: "Mi distribución habitual",
		recommended: true,
	},
	{ value: "all_to_savings", title: "Todo al ahorro" },
];

function optionDetail(
	policy: DistributionPolicy,
	preview: ImpactPreviewResult | null,
	amountCents: number,
	currencyCode: string,
	extraordinaryType: ExtraordinaryType,
): string {
	if (policy === "all_to_savings") {
		if (extraordinaryType === "cts") {
			return `Los ${formatCents(amountCents, { currency: currencyCode })} completos van a tu Fondo de emergencia`;
		}
		return `Los ${formatCents(amountCents, { currency: currencyCode })} completos van a tu ahorro`;
	}
	if (!preview) {
		return "50/30/20 según tu perfil";
	}
	const { needs, wants, savings } = preview.distribution;
	return `50/30/20 · Nec ${formatCents(needs, { currency: currencyCode, showSymbol: false })} · Gustos ${formatCents(wants, { currency: currencyCode, showSymbol: false })} · Ahorro ${formatCents(savings, { currency: currencyCode, showSymbol: false })}`;
}

export function IncomeDestinationDialog({
	open,
	onOpenChange,
	extraordinaryType,
	amountCents,
	currencyCode,
	preview,
	value,
	onConfirm,
}: Props) {
	const [draft, setDraft] = useState<DistributionPolicy | undefined>(value);

	const typeTitle = extraordinaryTypeDisplayTitle(extraordinaryType);
	const dialogTitle =
		extraordinaryType === "gratification_july" || extraordinaryType === "gratification_december"
			? `¿A dónde va tu gratificación?`
			: `¿A dónde va tu ${typeTitle.toLowerCase()}?`;

	const selected = draft ?? value;

	// Shared option cards rendered on both mobile and desktop
	const optionCards = (
		<div className="flex flex-col gap-3">
			{OPTIONS.map((option) => {
				const isSelected = selected === option.value;
				const label =
					option.value === "all_to_savings" && extraordinaryType === "cts"
						? "Todo al Fondo de emergencia"
						: option.title;
				return (
					<button
						key={option.value}
						type="button"
						onClick={() => setDraft(option.value)}
						className={cn(
							"flex items-center gap-4 rounded-[15px] border px-5 py-[18px] text-left transition-colors",
							isSelected
								? "border-[1.5px] border-qp bg-qp-soft"
								: "border-line bg-card hover:border-line-strong",
						)}
					>
						<span
							className={cn(
								"size-[22px] shrink-0 rounded-full border-[6px] border-qp bg-card",
								!isSelected && "border-[1.7px] border-[#C9C3BA] bg-transparent",
							)}
							aria-hidden
						/>
						<div className="min-w-0 flex-1">
							<div className="flex flex-wrap items-center gap-2">
								<span className="font-semibold text-[15.5px] text-ink">{label}</span>
								{option.recommended ? (
									<span className="rounded-full bg-qp-soft px-2 py-0.5 text-[10.5px] font-semibold text-qp-deep">
										Recomendado
									</span>
								) : null}
							</div>
							<p className="mt-0.5 text-[13px] text-ink-secondary">
								{optionDetail(option.value, preview, amountCents, currencyCode, extraordinaryType)}
							</p>
						</div>
						{option.value === "all_to_savings" && amountCents > 0 ? (
							<span className="shrink-0 font-serif text-lg text-moss">
								+ {formatCents(amountCents, { currency: currencyCode })}
							</span>
						) : null}
					</button>
				);
			})}
		</div>
	);

	return (
		<Dialog
			open={open}
			onOpenChange={(next) => {
				if (next) setDraft(value);
				onOpenChange(next);
			}}
		>
			{/*
        Mobile (< md): full-screen immersive panel.
        Desktop (md+): standard centered dialog at max-w-[760px].
        Base UI DialogContent uses Tailwind classes for positioning (not inline styles),
        so max-md: responsive overrides work correctly.
      */}
			<DialogContent
				showCloseButton={false}
				className={cn(
					// Mobile full-screen overrides
					"max-md:inset-0 max-md:top-0 max-md:left-0 max-md:translate-none max-md:max-w-full max-md:w-full max-md:h-dvh max-md:rounded-none max-md:flex max-md:flex-col max-md:overflow-hidden",
					// Desktop: standard dialog
					"md:max-w-[760px] md:rounded-[14px]",
					// Shared
					"border-line bg-canvas p-0",
				)}
			>
				{/* Mobile header — sticky within the full-screen panel */}
				<div className="flex items-center border-b border-line px-4 pt-[env(safe-area-inset-top)] pb-0 md:hidden">
					<div className="flex h-[52px] flex-1 items-center justify-between">
						<button
							type="button"
							onClick={() => onOpenChange(false)}
							className="flex items-center gap-1 text-[13.5px] text-mute hover:text-ink"
							aria-label={INCOME_DESTINATION_DIALOG_BACK}
						>
							<ArrowLeft size={16} aria-hidden />
							{INCOME_DESTINATION_DIALOG_BACK}
						</button>
						<span className="pointer-events-none font-serif text-[17px] font-medium text-ink">
							¿A dónde va?
						</span>
						<span className="w-12" aria-hidden />
					</div>
				</div>

				{/* Scrollable body */}
				<div className="flex-1 overflow-y-auto px-4 py-5 md:px-[34px] md:py-[30px]">
					{/* Desktop header */}
					<DialogHeader className="hidden text-left md:flex">
						<DialogTitle className="font-serif text-[26px] font-medium text-ink">
							{dialogTitle}
						</DialogTitle>
					</DialogHeader>
					<p className="mt-1 text-[13.5px] text-mute">
						{formatCents(amountCents, { currency: currencyCode })} · elige solo para este ingreso.
						Tu reparto habitual queda igual.
					</p>

					<div className="mt-5">{optionCards}</div>

					<div className="mt-5 flex items-start gap-2.5 rounded-[12px] border border-qp-border bg-qp-soft px-[15px] py-3">
						<span
							className="mt-0.5 size-5 shrink-0 rounded-full border-[1.6px] border-qp-deep"
							aria-hidden
						/>
						<p className="text-[13px] leading-snug text-qp-deep">
							{INCOME_DESTINATION_DIALOG_NOTE}
						</p>
					</div>

					{/* Desktop CTAs — inside the scrollable body */}
					<div className="mt-5 hidden justify-end gap-2.5 md:flex">
						<Button
							type="button"
							variant="outline"
							className="h-[46px] rounded-[11px] border-line bg-card px-[22px] text-[14.5px] font-semibold text-mute"
							onClick={() => onOpenChange(false)}
						>
							{INCOME_DESTINATION_DIALOG_BACK}
						</Button>
						<Button
							type="button"
							disabled={!selected}
							className="h-[46px] rounded-[11px] bg-ink px-[26px] text-[14.5px] font-semibold text-canvas"
							onClick={() => {
								if (!selected) return;
								onConfirm(selected);
								onOpenChange(false);
							}}
						>
							{INCOME_DESTINATION_DIALOG_CONFIRM}
						</Button>
					</div>
				</div>

				{/* Mobile sticky footer CTAs */}
				<div className="border-t border-line px-4 pt-3 pb-[max(env(safe-area-inset-bottom),12px)] md:hidden">
					<div className="flex items-center gap-2.5">
						<Button
							type="button"
							variant="outline"
							className="h-[44px] flex-1 rounded-[11px] border-line bg-card text-[14px] font-semibold text-mute"
							onClick={() => onOpenChange(false)}
						>
							{INCOME_DESTINATION_DIALOG_BACK}
						</Button>
						<Button
							type="button"
							disabled={!selected}
							className="h-[44px] flex-1 rounded-[11px] bg-ink text-[14px] font-semibold text-canvas"
							onClick={() => {
								if (!selected) return;
								onConfirm(selected);
								onOpenChange(false);
							}}
						>
							{INCOME_DESTINATION_DIALOG_CONFIRM}
						</Button>
					</div>
				</div>
			</DialogContent>
		</Dialog>
	);
}
