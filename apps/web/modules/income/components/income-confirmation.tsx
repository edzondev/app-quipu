"use client";

import Link from "next/link";
import { Check } from "reicon-react/icons/Check";
import { buttonVariants } from "@/shared/components/ui/button-variants";
import { ENVELOPE_LABELS } from "@/shared/constants/envelopes";
import type { DistributionPolicy } from "@/shared/lib/allocations";
import { formatCents } from "@/shared/lib/money";
import { cn } from "@/shared/lib/utils";
import {
	ENVELOPE_INCOME_STYLES,
	getIncomeSourceLabel,
	INCOME_EXTRAORDINARY_SUCCESS_BADGE,
	INCOME_EXTRAORDINARY_SUCCESS_BODY_ALL_TO_SAVINGS,
	INCOME_EXTRAORDINARY_SUCCESS_BODY_PROFILE_DEFAULT,
	INCOME_EXTRAORDINARY_SUCCESS_TITLE_SUFFIX,
	INCOME_HOME_CTA,
	INCOME_SUCCESS_BODY_PREFIX,
	INCOME_SUCCESS_BODY_SUFFIX,
	INCOME_SUCCESS_DAILY_LABEL,
	INCOME_SUCCESS_MOVE_SURPLUS_CTA,
	INCOME_SUCCESS_TITLE,
} from "../constants";
import type { IncomeRegisterResult } from "../types";

type Props = {
	result: IncomeRegisterResult;
	currencyCode: string;
	variant?: "habitual" | "extraordinary";
	distributionPolicy?: DistributionPolicy;
	showMoveSurplusLink?: boolean;
};

export function IncomeConfirmation({
	result,
	currencyCode,
	variant = "habitual",
	distributionPolicy = "profile_default",
	showMoveSurplusLink = false,
}: Props) {
	const isExtraordinary = variant === "extraordinary";
	const sourceLabel = getIncomeSourceLabel(result.source);
	const formattedAmount = formatCents(result.amount, {
		currency: currencyCode,
	});

	const title = isExtraordinary
		? `${result.description} ${INCOME_EXTRAORDINARY_SUCCESS_TITLE_SUFFIX}`
		: INCOME_SUCCESS_TITLE;

	const body = isExtraordinary ? (
		<>
			{formattedAmount}{" "}
			{distributionPolicy === "all_to_savings"
				? INCOME_EXTRAORDINARY_SUCCESS_BODY_ALL_TO_SAVINGS
				: INCOME_EXTRAORDINARY_SUCCESS_BODY_PROFILE_DEFAULT}
		</>
	) : (
		<>
			{formattedAmount} de {sourceLabel.toLowerCase()} {INCOME_SUCCESS_BODY_PREFIX}{" "}
			{INCOME_SUCCESS_BODY_SUFFIX}
		</>
	);

	return (
		<div className="mx-auto max-w-2xl px-1 py-6 text-center md:px-4 md:py-10">
			<div
				className={cn(
					"rounded-[18px] px-4 py-8 md:px-10 md:py-12",
					isExtraordinary
						? "bg-[radial-gradient(110%_60%_at_50%_0%,var(--extraordinary-surface),var(--color-canvas)_55%)]"
						: "bg-[radial-gradient(110%_60%_at_50%_0%,var(--qp-soft),var(--qp-surface)_60%)]",
				)}
			>
				<div
					className={cn(
						"mx-auto mb-5 flex size-[70px] items-center justify-center rounded-full shadow-[0_14px_34px_-14px_var(--qp-shadow-strong)]",
						isExtraordinary
							? "bg-extraordinary-a shadow-[0_12px_30px_-12px_rgba(176,132,48,0.7)]"
							: "bg-qp",
					)}
				>
					<Check size={18} color="var(--color-canvas)" strokeWidth={3} aria-hidden />
				</div>

				<div className="flex flex-wrap items-center justify-center gap-2">
					<h2 className="font-serif text-[30px] font-medium text-ink">{title}</h2>
					{isExtraordinary ? (
						<span className="inline-flex items-center gap-1.5 rounded-full border border-extraordinary-border bg-extraordinary-surface px-2.5 py-1 text-[11px] font-semibold text-extraordinary-b">
							<span className="size-1.5 rotate-45 rounded-sm bg-extraordinary-a" aria-hidden />
							{INCOME_EXTRAORDINARY_SUCCESS_BADGE}
						</span>
					) : null}
				</div>

				<p className="mt-2 text-[15px] text-mute">{body}</p>

				<div
					className={cn(
						"mt-7 grid gap-3 text-left",
						isExtraordinary ? "md:grid-cols-1" : "md:grid-cols-3",
					)}
				>
					{result.envelopes.map((envelope) => {
						const styles = ENVELOPE_INCOME_STYLES[envelope.type];
						const delta = envelope.delta;
						if (isExtraordinary && delta === 0) {
							return null;
						}
						return (
							<div
								key={envelope.type}
								className={cn(
									"rounded-[14px] border border-line bg-card px-[18px] py-4",
									isExtraordinary && "flex items-center justify-between gap-3 py-3.5",
								)}
							>
								<div
									className={cn(
										"flex items-center gap-2 text-[12.5px] text-mute",
										isExtraordinary && "mb-0 text-[13.5px] text-ink",
									)}
								>
									<span className={`size-2 rounded-full ${styles.dot}`} aria-hidden />
									{ENVELOPE_LABELS[envelope.type]}
								</div>
								{isExtraordinary ? (
									<span className="text-xs text-qp-deep">
										+{" "}
										{formatCents(delta, {
											currency: currencyCode,
										})}
									</span>
								) : (
									<>
										<div className="font-serif text-xl text-ink">
											{formatCents(envelope.remainingAmount, {
												currency: currencyCode,
											})}
										</div>
										<div className="mt-0.5 text-[11.5px] text-qp-deep">
											+{" "}
											{formatCents(delta, {
												currency: currencyCode,
												showSymbol: false,
											})}
										</div>
									</>
								)}
							</div>
						);
					})}
				</div>

				{!isExtraordinary ? (
					<div className="mt-5 flex items-center justify-center gap-2 rounded-[12px] border border-qp-border bg-qp-soft px-3.5 py-3.5 text-sm text-qp-deep">
						{INCOME_SUCCESS_DAILY_LABEL}{" "}
						<span className="font-serif text-[19px] text-ink">
							{formatCents(result.displayDailyCents, {
								currency: currencyCode,
							})}
						</span>
					</div>
				) : null}

				<Link
					href="/dashboard"
					className={cn(
						buttonVariants(),
						"mt-6 inline-flex h-12 rounded-[11px] bg-ink px-8 text-[15px] font-semibold text-canvas hover:bg-ink/90",
					)}
				>
					{INCOME_HOME_CTA}
				</Link>

				{showMoveSurplusLink ? (
					<Link
						href="/savings/move?from=wants"
						className={cn(
							buttonVariants({ variant: "outline" }),
							"mt-3 inline-flex h-11 rounded-[11px] border-extraordinary-border bg-extraordinary-surface px-6 text-[14px] font-medium text-extraordinary-b hover:bg-extraordinary-surface/80",
						)}
					>
						{INCOME_SUCCESS_MOVE_SURPLUS_CTA}
					</Link>
				) : null}
			</div>
		</div>
	);
}
