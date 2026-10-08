"use client";

import Link from "next/link";
import { ArrowRight } from "reicon-react/icons/ArrowRight";
import { ENVELOPE_LABELS } from "@/shared/constants/envelopes";
import { formatCents } from "@/shared/lib/money";
import {
	ENVELOPE_INCOME_STYLES,
	INCOME_IMPACT_DISTRIBUTABLE_LABEL,
	INCOME_IMPACT_GROSS_LABEL,
	INCOME_IMPACT_HELD_LABEL,
	INCOME_IMPACT_MOVE_SURPLUS,
	INCOME_IMPACT_TITLE,
	INCOME_NEW_DAILY_LABEL,
} from "../constants";
import type { ImpactPreviewResult } from "../lib/impactPreview";

type Props = {
	preview: ImpactPreviewResult | null;
	currencyCode: string;
	moveSurplusHref?: string;
};

export function IncomeImpactPreview({ preview, currencyCode, moveSurplusHref }: Props) {
	const showHoldBreakdown = preview !== null && preview.heldCents > 0;

	return (
		<div className="rounded-2xl border border-qp-border bg-[linear-gradient(160deg,var(--qp-soft),var(--qp-canvas)_70%)] p-5 md:p-6">
			<p className="mb-4 font-mono text-[10.5px] tracking-[0.1em] text-qp-deep uppercase">
				{INCOME_IMPACT_TITLE}
			</p>

			{!preview ? (
				<p className="text-sm text-mute">Ingresa un monto para ver cómo se reparte.</p>
			) : (
				<>
					{showHoldBreakdown ? (
						<div className="mb-4 flex flex-col gap-1 rounded-[10px] border border-qp-border bg-card/60 px-3.5 py-3">
							<div className="flex items-center justify-between text-[12.5px]">
								<span className="text-mute">{INCOME_IMPACT_GROSS_LABEL}</span>
								<span className="font-serif text-ink">
									{formatCents(preview.heldCents + preview.distributableCents, {
										currency: currencyCode,
									})}
								</span>
							</div>
							<div className="flex items-center justify-between text-[12.5px]">
								<span className="text-mute">{INCOME_IMPACT_HELD_LABEL}</span>
								<span className="font-serif text-[#8A6A4E]">
									− {formatCents(preview.heldCents, { currency: currencyCode })}
								</span>
							</div>
							<div className="mt-0.5 flex items-center justify-between border-t border-qp-border pt-1.5 text-[13px] font-medium">
								<span className="text-ink">{INCOME_IMPACT_DISTRIBUTABLE_LABEL}</span>
								<span className="font-serif text-ink">
									{formatCents(preview.distributableCents, {
										currency: currencyCode,
									})}
								</span>
							</div>
						</div>
					) : null}

					<div className="flex flex-col gap-4">
						{(["needs", "wants", "savings"] as const).map((type) => {
							const styles = ENVELOPE_INCOME_STYLES[type];
							const delta = preview.distribution[type];
							const percent = preview.weightPercents[type];

							return (
								<div key={type}>
									<div className="mb-1.5 flex items-center justify-between gap-3">
										<span className="flex items-center gap-2 text-sm text-ink">
											<span className={`size-2 rounded-full ${styles.dot}`} aria-hidden />
											{ENVELOPE_LABELS[type]}
											<span className="text-xs text-mute">· {percent}%</span>
										</span>
										<span className="font-serif text-lg text-qp-deep">
											+ {formatCents(delta, { currency: currencyCode })}
										</span>
									</div>
									<div className={`h-1.5 overflow-hidden rounded-sm ${styles.track}`}>
										<div className={`h-full ${styles.bar}`} style={{ width: `${percent}%` }} />
									</div>
								</div>
							);
						})}
					</div>

					<div className="mt-5 flex items-center justify-between border-t border-qp-border pt-4">
						<span className="text-[13px] text-qp-deep">{INCOME_NEW_DAILY_LABEL}</span>
						<span className="font-serif text-[22px] text-ink">
							{formatCents(preview.projectedDailyCents, {
								currency: currencyCode,
							})}
						</span>
					</div>

					{moveSurplusHref ? (
						<Link
							href={moveSurplusHref}
							className="mt-4 flex items-center justify-between rounded-[11px] border border-qp-border bg-card px-3.5 py-2.5 text-[13px] font-semibold text-qp-deep no-underline hover:bg-qp-soft/50"
						>
							<span className="flex items-center gap-2">
								<span className="size-2 rounded-full bg-moss" aria-hidden />
								{INCOME_IMPACT_MOVE_SURPLUS}
							</span>
							<ArrowRight size={16} color="currentColor" aria-hidden />
						</Link>
					) : null}
				</>
			)}
		</div>
	);
}
