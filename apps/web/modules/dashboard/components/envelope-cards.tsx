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
	ENVELOPE_EARLY_SAVINGS_SUBCOPY,
} from "../constants";
import { clampPercent } from "../lib/dashboard-math";
import type { DashboardEnvelope } from "../types";
import { EnvelopeSectionLabel } from "./envelope-cards-skeleton";

type Props = {
	envelopes: DashboardEnvelope[];
	currencyCode: string;
	isEarlyCycle?: boolean;
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

export function EnvelopeCards({ envelopes, currencyCode, isEarlyCycle = false }: Props) {
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
					// Ahorro en Home: muestra lo aportable del sobre (remaining) cuando
					// hay ciclo en curso; si remaining es 0 y hay allocated, el dinero
					// ya se movió al Fondo (no es un segundo total gastable).
					const isSavings = envelope.type === "savings";
					const displayAmount = isSavings
						? envelope.remainingAmount > 0
							? Math.max(0, envelope.remainingAmount)
							: envelope.allocatedAmount
						: isEarlyCycle
							? envelope.allocatedAmount
							: Math.max(0, envelope.remainingAmount);
					const percent = isSavings
						? envelope.allocatedAmount > 0
							? Math.round(
									(Math.max(0, envelope.allocatedAmount - envelope.remainingAmount) /
										envelope.allocatedAmount) *
										100,
								)
							: 0
						: clampPercent(envelope.percentRemaining);

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
							<p className="font-serif text-xl text-ink md:text-2xl">
								{formatCents(displayAmount, {
									currency: currencyCode,
								})}
							</p>
							<p className="mt-1 text-xs text-mute">
								{isEarlyCycle ? (
									isSavings ? (
										ENVELOPE_EARLY_SAVINGS_SUBCOPY
									) : (
										ENVELOPE_EARLY_NEEDS_WANTS_SUBCOPY
									)
								) : (
									<>
										{isSavings ? "apartado" : "disponible"} de{" "}
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
						</article>
					);
				})}
			</div>
		</section>
	);
}
