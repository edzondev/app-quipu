"use client";

import { useSyncExternalStore } from "react";
import { Button } from "@/shared/components/ui/button";
import { formatCents } from "@/shared/lib/money";
import {
	CYCLE_CLOSE_REPORT_DISMISS,
	CYCLE_CLOSE_REPORT_DISMISS_KEY,
	CYCLE_CLOSE_REPORT_EXTRAORDINARY_HINT,
	CYCLE_CLOSE_REPORT_EYEBROW,
	CYCLE_CLOSE_REPORT_INCOME,
	CYCLE_CLOSE_REPORT_SAVINGS,
	CYCLE_CLOSE_REPORT_SPEND,
	CYCLE_CLOSE_REPORT_STREAK,
	CYCLE_CLOSE_REPORT_STREAK_SUFFIX,
	CYCLE_CLOSE_REPORT_TITLE,
} from "../constants";
import type { CycleCloseReportQueryResult } from "../queries";
import { useLatestCloseReport } from "../queries";

type Props = {
	currencyCode: string;
};

type CloseReport = NonNullable<CycleCloseReportQueryResult>["report"];
type EnvelopeSpendRow = CloseReport["spendByEnvelope"][number];

const dismissListeners = new Set<() => void>();

function dismissStorageKey(closedCycleId: string) {
	return `${CYCLE_CLOSE_REPORT_DISMISS_KEY}:${closedCycleId}`;
}

function subscribeDismissStore(onStoreChange: () => void) {
	dismissListeners.add(onStoreChange);
	const onStorage = (event: StorageEvent) => {
		if (event.key?.startsWith(`${CYCLE_CLOSE_REPORT_DISMISS_KEY}:`)) {
			onStoreChange();
		}
	};
	window.addEventListener("storage", onStorage);
	return () => {
		dismissListeners.delete(onStoreChange);
		window.removeEventListener("storage", onStorage);
	};
}

function notifyDismissStore() {
	for (const listener of dismissListeners) {
		listener();
	}
}

function isDismissedInStorage(closedCycleId: string) {
	return window.localStorage.getItem(dismissStorageKey(closedCycleId)) === "1";
}

function persistDismiss(closedCycleId: string) {
	window.localStorage.setItem(dismissStorageKey(closedCycleId), "1");
	notifyDismissStore();
}

export function CycleCloseReportCard({ currencyCode }: Props) {
	const data = useLatestCloseReport();
	const closedCycleId = data?.justClosed && data.report ? data.report.closedCycleId : null;

	const getSnapshot = () => (closedCycleId ? isDismissedInStorage(closedCycleId) : true);

	const dismissed = useSyncExternalStore(subscribeDismissStore, getSnapshot, () => true);

	if (!data?.report || !data.justClosed || dismissed) {
		return null;
	}

	const { report } = data;
	const spendLines = report.spendByEnvelope.filter(
		(row: EnvelopeSpendRow) => row.type !== "savings" && row.spentCents > 0,
	);

	return (
		<section
			aria-labelledby="cycle-close-report-title"
			className="mb-3 rounded-xl border border-qp-border/60 bg-card p-4 shadow-[inset_3px_0_0_0_var(--qp)] md:mb-5 md:p-5"
		>
			<p className="font-mono text-[10px] uppercase tracking-[0.1em] text-qp-deep">
				{CYCLE_CLOSE_REPORT_EYEBROW}
			</p>
			<h2
				id="cycle-close-report-title"
				className="mt-2 font-serif text-[19px] font-medium text-ink"
			>
				{CYCLE_CLOSE_REPORT_TITLE(report.cycleLabel)}
			</h2>

			{report.hasExtraordinaryIncome ? (
				<p className="mt-1 text-[12px] text-mute">{CYCLE_CLOSE_REPORT_EXTRAORDINARY_HINT}</p>
			) : null}

			<dl className="mt-4 space-y-3">
				<div className="flex items-baseline justify-between gap-3">
					<dt className="text-[12.5px] font-medium text-ink-secondary">
						{CYCLE_CLOSE_REPORT_INCOME}
					</dt>
					<dd className="font-serif text-[17px] text-ink">
						{formatCents(report.totalIncomeCents, { currency: currencyCode })}
					</dd>
				</div>

				{spendLines.length > 0 ? (
					<div>
						<dt className="text-[12.5px] font-medium text-ink-secondary">
							{CYCLE_CLOSE_REPORT_SPEND}
						</dt>
						<dd className="mt-1.5 space-y-1">
							{spendLines.map((row: EnvelopeSpendRow) => (
								<div
									key={row.type}
									className="flex items-baseline justify-between gap-3 text-[13px]"
								>
									<span className="text-mute">{row.label}</span>
									<span className="font-medium text-ink">
										{formatCents(row.spentCents, { currency: currencyCode })}
									</span>
								</div>
							))}
						</dd>
					</div>
				) : null}

				<div className="flex items-baseline justify-between gap-3">
					<dt className="text-[12.5px] font-medium text-ink-secondary">
						{CYCLE_CLOSE_REPORT_SAVINGS}
					</dt>
					<dd className="font-serif text-[17px] text-ink">
						{formatCents(report.savingsCents, { currency: currencyCode })}
					</dd>
				</div>

				<div className="flex items-baseline justify-between gap-3 border-t border-line pt-3">
					<dt className="text-[12.5px] font-medium text-ink-secondary">
						{CYCLE_CLOSE_REPORT_STREAK}
					</dt>
					<dd className="text-[13px] font-semibold text-qp-deep">
						{report.streak}{" "}
						<span className="font-normal text-mute">
							{CYCLE_CLOSE_REPORT_STREAK_SUFFIX(report.streak)}
						</span>
					</dd>
				</div>
			</dl>

			<Button
				type="button"
				variant="outline"
				className="mt-4 w-full sm:w-auto"
				onClick={() => persistDismiss(report.closedCycleId)}
			>
				{CYCLE_CLOSE_REPORT_DISMISS}
			</Button>
		</section>
	);
}
