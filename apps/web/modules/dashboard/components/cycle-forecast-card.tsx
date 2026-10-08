"use client";

import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { PremiumUpsellNudge } from "@/shared/components/premium-upsell-nudge";
import { formatCents } from "@/shared/lib/money";
import {
	FORECAST_ALREADY_DEPLETED,
	FORECAST_DEFICIT_LINE,
	FORECAST_DEPLETION_LINE,
	FORECAST_EARLY_CYCLE_BODY,
	FORECAST_HEALTHY_BODY,
	FORECAST_HEALTHY_TITLE,
	FORECAST_PAYWALL_NUDGE,
	FORECAST_SECTION_LABEL,
	FORECAST_SURPLUS_LINE,
} from "../constants";

type Props = {
	currencyCode: string;
	isPremium: boolean;
};

function forecastLineForEnvelope(
	envelope: {
		label: string;
		daysUntilDepleted: number | null;
		closeProjectionCents: number | null;
		depletedCalendarDay: number | null;
	},
	currencyCode: string,
): string | null {
	if (envelope.daysUntilDepleted === 0) {
		return FORECAST_ALREADY_DEPLETED(envelope.label);
	}
	if (
		envelope.depletedCalendarDay !== null &&
		envelope.daysUntilDepleted !== null &&
		envelope.daysUntilDepleted > 0
	) {
		return FORECAST_DEPLETION_LINE(envelope.label, envelope.depletedCalendarDay);
	}
	if (envelope.closeProjectionCents === null) {
		return null;
	}
	const amount = formatCents(Math.abs(envelope.closeProjectionCents), {
		currency: currencyCode,
	});
	if (envelope.closeProjectionCents >= 0) {
		return FORECAST_SURPLUS_LINE(envelope.label, amount);
	}
	return FORECAST_DEFICIT_LINE(envelope.label, amount);
}

export function CycleForecastCard({ currencyCode, isPremium }: Props) {
	const forecast = useQuery(api.forecast.getCycleForecast, isPremium ? {} : "skip");

	if (!isPremium) {
		return <PremiumUpsellNudge eyebrow={FORECAST_SECTION_LABEL} message={FORECAST_PAYWALL_NUDGE} />;
	}

	if (forecast === undefined) {
		return (
			<section
				aria-labelledby="cycle-forecast-title"
				className="rounded-xl border border-line/70 bg-card p-3 md:p-5"
			>
				<p className="text-[12.5px] font-medium text-ink-secondary">{FORECAST_SECTION_LABEL}</p>
				<div className="mt-3 h-12 animate-pulse rounded-[10px] bg-surface-warm" />
			</section>
		);
	}

	if (forecast === null) {
		return (
			<section
				aria-labelledby="cycle-forecast-title"
				className="rounded-xl border border-line/70 bg-card p-3 md:p-5"
			>
				<p className="text-[12.5px] font-medium text-ink-secondary">{FORECAST_SECTION_LABEL}</p>
				<p id="cycle-forecast-title" className="mt-2 text-[13px] leading-snug text-mute">
					{FORECAST_EARLY_CYCLE_BODY}
				</p>
			</section>
		);
	}

	const spendEnvelopes = forecast.envelopes.filter((envelope) => envelope.type !== "savings");
	const lines = spendEnvelopes
		.map((envelope) => forecastLineForEnvelope(envelope, currencyCode))
		.filter((line): line is string => line !== null);

	if (lines.length === 0) {
		return (
			<section
				aria-labelledby="cycle-forecast-title"
				className="rounded-xl border border-line/70 bg-card p-3 md:p-5"
			>
				<p className="text-[12.5px] font-medium text-ink-secondary">{FORECAST_SECTION_LABEL}</p>
				<h2 id="cycle-forecast-title" className="mt-2 font-serif text-[17px] font-medium text-ink">
					{FORECAST_HEALTHY_TITLE}
				</h2>
				<p className="mt-2 text-[13px] leading-snug text-mute">{FORECAST_HEALTHY_BODY}</p>
			</section>
		);
	}

	return (
		<section
			aria-labelledby="cycle-forecast-title"
			className="rounded-xl border border-line/70 bg-card p-3 md:p-5"
		>
			<p className="text-[12.5px] font-medium text-ink-secondary">{FORECAST_SECTION_LABEL}</p>
			{forecast.earliestDepletion?.calendarDay ? (
				<p id="cycle-forecast-title" className="mt-2 font-serif text-[17px] font-medium text-ink">
					{FORECAST_DEPLETION_LINE(
						forecast.earliestDepletion.envelopeLabel,
						forecast.earliestDepletion.calendarDay,
					)}
				</p>
			) : (
				<h2 id="cycle-forecast-title" className="mt-2 font-serif text-[17px] font-medium text-ink">
					Proyección de cierre
				</h2>
			)}

			<ul className="mt-3 space-y-2">
				{lines.map((line) => (
					<li
						key={line}
						className="rounded-lg border border-line/70 bg-surface-warm/40 px-3 py-2 text-[13px] text-ink-secondary md:px-3.5"
					>
						{line}
					</li>
				))}
			</ul>
		</section>
	);
}
