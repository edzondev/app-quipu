"use client";

import { useState } from "react";
import { DEFAULT_CURRENCY } from "@/core/constants";
import { useMyProfile } from "@/modules/auth/hooks/use-my-profile";
import { AddCommitmentDialog } from "@/shared/components/commitments/add-commitment-dialog";
import { ADD_COMMITMENT_CTA } from "@/shared/constants/commitments";
import { ENVELOPE_LABELS } from "@/shared/constants/envelopes";
import { formatCents } from "@/shared/lib/money";
import { cn } from "@/shared/lib/utils";
import {
	SETTINGS_COMMITMENTS_EMPTY,
	SETTINGS_COMMITMENTS_LABEL,
	SETTINGS_COMMITMENTS_TOTAL_SUFFIX,
} from "../constants";
import { useSettingsCommitments } from "../queries";
import { SettingsSection } from "./settings-section";

function envelopeDot(envelope: "needs" | "wants") {
	return envelope === "needs" ? "bg-needs" : "bg-clay";
}

export function SettingsCommitmentsSection({
	className,
	id = "compromisos",
}: {
	className?: string;
	id?: string;
}) {
	const commitments = useSettingsCommitments();
	const profile = useMyProfile();
	const [addOpen, setAddOpen] = useState(false);
	const currencyCode = profile?.currencyCode ?? DEFAULT_CURRENCY.code;

	if (commitments === undefined) {
		return (
			<div
				id={id}
				className={cn(
					"h-64 animate-pulse scroll-mt-6 rounded-xl border border-line/70 bg-card",
					className,
				)}
			/>
		);
	}

	const totalCents = commitments.reduce((sum, c) => sum + c.amount, 0);

	return (
		<SettingsSection
			id={id}
			className={cn("scroll-mt-6 flex flex-col", className)}
			contentClassName="flex flex-1 flex-col"
			title={SETTINGS_COMMITMENTS_LABEL}
			titleAside={
				commitments.length > 0 ? (
					<span className="text-xs text-mute">
						{formatCents(totalCents, { currency: currencyCode })}{" "}
						{SETTINGS_COMMITMENTS_TOTAL_SUFFIX}
					</span>
				) : null
			}
		>
			{commitments.length === 0 ? (
				<p className="mb-3 flex-1 text-[13px] text-mute md:mb-0">{SETTINGS_COMMITMENTS_EMPTY}</p>
			) : (
				<ul className="flex flex-1 flex-col gap-2">
					{commitments.map((commitment) => (
						<li
							key={commitment._id}
							className="flex items-center gap-3 rounded-lg bg-surface-warm/40 px-3.5 py-2.5"
						>
							<span
								className={cn("size-2 shrink-0 rounded-full", envelopeDot(commitment.envelope))}
							/>
							<div className="min-w-0 flex-1">
								<div className="truncate text-[13.5px] font-semibold text-ink">
									{commitment.name}
								</div>
								<div className="text-[11px] text-faint">
									{ENVELOPE_LABELS[commitment.envelope]} · día {commitment.dueDay}
								</div>
							</div>
							<span className="font-serif text-[15px] text-ink">
								{formatCents(commitment.amount, { currency: currencyCode })}
							</span>
						</li>
					))}
				</ul>
			)}

			<button
				type="button"
				onClick={() => setAddOpen(true)}
				className="mt-3 w-full shrink-0 rounded-lg border border-dashed border-qp-border bg-surface-warm/40 py-2.5 text-[13.5px] font-semibold text-qp-deep transition-colors hover:bg-qp-soft md:mt-auto"
			>
				{ADD_COMMITMENT_CTA}
			</button>

			<AddCommitmentDialog open={addOpen} onOpenChange={setAddOpen} />
		</SettingsSection>
	);
}
