"use client";

import type { KeyboardEvent } from "react";
import { AnalyticsEvents, track } from "@/core/analytics";
import { useExpenseRegister } from "@/modules/expenses/hooks/use-expense-register-context";
import type { ExpenseEnvelopeType } from "@/modules/expenses/lib/envelopeSuggestion";
import { ENVELOPE_LABELS } from "@/shared/constants/envelopes";
import { formatCents } from "@/shared/lib/money";
import {
	DASHBOARD_ENVELOPES_SECTION_ID,
	ENVELOPE_EARLY_NEEDS_WANTS_SUBCOPY,
	ENVELOPE_OVERSPENT_LABEL,
	SAVINGS_PLANNED_LABEL,
	SAVINGS_SAVED_LABEL,
} from "../constants";
import { clampPercent } from "../lib/dashboard-math";
import type { DashboardEnvelope } from "../types";
import { EnvelopeSectionLabel } from "./envelope-cards-skeleton";

type Props = {
	envelopes: DashboardEnvelope[];
	currencyCode: string;
	isEarlyCycle?: boolean;
	/** Fondo de emergencia + metas, from `savings.getOverview.totalSavedCents`. */
	savedCents?: number;
};

const ENVELOPE_STYLES = {
	needs: {
		dot: "bg-steel",
		track: "bg-steel-soft",
		bar: "bg-steel",
	},
	wants: {
		dot: "bg-clay",
		track: "bg-clay-soft",
		bar: "bg-clay",
	},
	savings: {
		dot: "bg-moss",
		track: "bg-moss-soft",
		bar: "bg-moss",
	},
} as const;

export function EnvelopeCards({
	envelopes,
	currencyCode,
	isEarlyCycle = false,
	savedCents,
}: Props) {
	const { open } = useExpenseRegister();

	function handleEnvelopeClick(type: "needs" | "wants" | "savings") {
		track(AnalyticsEvents.ENVELOPE_OPENED, { envelope_type: type });
		if (type === "savings") return;
		open({
			variant: "envelope",
			preselectedEnvelope: type as ExpenseEnvelopeType,
		});
	}

	return (
		<section id={DASHBOARD_ENVELOPES_SECTION_ID} aria-labelledby="dashboard-envelopes-heading">
			<EnvelopeSectionLabel />
			<div className="grid gap-2 md:grid-cols-3 md:gap-3">
				{envelopes.map((envelope) => {
					const styles = ENVELOPE_STYLES[envelope.type];
					const isSavings = envelope.type === "savings";
					const overspent = !isSavings && envelope.remainingAmount < 0;
					const displayAmount =
						isEarlyCycle && !overspent ? envelope.allocatedAmount : envelope.remainingAmount;
					const assignedPercent =
						envelope.allocatedAmount > 0
							? Math.round(
									(Math.max(0, envelope.allocatedAmount - envelope.remainingAmount) /
										envelope.allocatedAmount) *
										100,
								)
							: 0;
					const percent = isSavings ? assignedPercent : clampPercent(envelope.percentRemaining);

					return (
						<article
							key={envelope.type}
							className={`rounded-xl border border-line/70 bg-card p-3 md:p-5 ${
								!isSavings
									? "cursor-pointer transition-colors hover:border-line hover:bg-surface-warm/40"
									: ""
							}`}
							{...(!isSavings
								? {
										role: "button" as const,
										tabIndex: 0,
										onClick: () => handleEnvelopeClick(envelope.type),
										onKeyDown: (event: KeyboardEvent) => {
											if (event.key === "Enter" || event.key === " ") {
												event.preventDefault();
												handleEnvelopeClick(envelope.type);
											}
										},
									}
								: {})}
						>
							<div className="mb-2 flex items-center gap-2 md:mb-3.5">
								<span className={`size-2 rounded-full ${styles.dot}`} aria-hidden />
								<h3 className="text-sm font-semibold text-ink">{ENVELOPE_LABELS[envelope.type]}</h3>
								{isSavings && percent >= 100 ? (
									<span className="ml-auto rounded-full bg-qp-soft px-2 py-0.5 text-[11px] font-semibold text-qp-deep">
										100%
									</span>
								) : null}
							</div>
							{isSavings ? (
								<>
									<dl className="space-y-2">
										<div>
											<dt className="text-xs text-mute">{SAVINGS_PLANNED_LABEL}</dt>
											<dd className="font-serif text-xl text-ink md:text-2xl">
												{formatCents(envelope.allocatedAmount, { currency: currencyCode })}
											</dd>
										</div>
										{savedCents != null ? (
											<div>
												<dt className="text-xs text-mute">{SAVINGS_SAVED_LABEL}</dt>
												<dd className="font-serif text-xl text-ink md:text-2xl">
													{formatCents(savedCents, { currency: currencyCode })}
												</dd>
											</div>
										) : null}
									</dl>
									<div className="mt-2 h-1.5 overflow-hidden rounded-[4px] bg-qp-track md:mt-3">
										<div
											className={`h-full rounded-[4px] ${styles.bar}`}
											style={{ width: `${percent}%` }}
										/>
									</div>
								</>
							) : (
								<>
									<p className="font-serif text-xl text-ink md:text-2xl">
										{formatCents(displayAmount, { currency: currencyCode })}
										{overspent ? (
											<>
												{" · "}
												<span className="text-warning-text">{ENVELOPE_OVERSPENT_LABEL}</span>
											</>
										) : null}
									</p>
									<p className="mt-1 text-xs text-mute">
										{isEarlyCycle ? (
											ENVELOPE_EARLY_NEEDS_WANTS_SUBCOPY
										) : (
											<>
												disponible de{" "}
												{formatCents(envelope.allocatedAmount, {
													currency: currencyCode,
												})}
											</>
										)}
									</p>
									<div className="mt-2 h-1.5 overflow-hidden rounded-[4px] bg-qp-track md:mt-3">
										<div
											className={`h-full rounded-[4px] ${styles.bar}`}
											style={{ width: `${percent}%` }}
										/>
									</div>
								</>
							)}
						</article>
					);
				})}
			</div>
		</section>
	);
}
