"use client";

import Link from "next/link";
import { Lock } from "reicon-react/icons/Lock";
import { buttonVariants } from "@/shared/components/ui/button-variants";
import { formatCents } from "@/shared/lib/money";
import { cn } from "@/shared/lib/utils";
import {
	EMERGENCY_FUND_ACTIVATE_CTA,
	EMERGENCY_FUND_AUTO_CONTRIBUTION_PREFIX,
	EMERGENCY_FUND_AUTO_CONTRIBUTION_SUFFIX,
	EMERGENCY_FUND_LABEL,
	EMERGENCY_FUND_PRE_TRACTION_BODY,
	EMERGENCY_FUND_PRE_TRACTION_BODY_MOBILE,
	EMERGENCY_FUND_PRIORITY_BADGE,
	EMERGENCY_FUND_START_BADGE,
	EMERGENCY_FUND_START_SMALL_CTA,
	EMERGENCY_FUND_START_SMALL_HINT,
	EMERGENCY_FUND_SUGGESTED_TARGET_PREFIX,
	EMERGENCY_FUND_TARGET_SUFFIX,
	SAVINGS_EMPTY_CTA,
} from "../constants";
import type { SavingsEmergencyFund } from "../types";

type Props = {
	fund: SavingsEmergencyFund;
	currencyCode: string;
	detailHref?: string;
	hasActiveCycle?: boolean;
};

export function EmergencyFundHero({
	fund,
	currencyCode,
	detailHref = "/savings/fund",
	hasActiveCycle = false,
}: Props) {
	const isPreTraction = fund.currentAmount === 0;

	const tractionContent = (
		<>
			<div
				className="pointer-events-none absolute -top-10 -right-8 size-56 rounded-full bg-[radial-gradient(circle,var(--qp-track),transparent_70%)]"
				aria-hidden
			/>
			<div className="relative mb-4 flex items-center gap-2.5">
				<span className="flex size-8 items-center justify-center rounded-[9px] bg-moss text-white">
					<Lock size={13} aria-hidden />
				</span>
				<span className="text-base font-semibold text-ink">{EMERGENCY_FUND_LABEL}</span>
				<span className="rounded-full bg-qp-panel px-2.5 py-0.5 text-[10.5px] font-semibold text-qp-deep">
					{EMERGENCY_FUND_PRIORITY_BADGE}
				</span>
			</div>

			<div className="relative flex flex-wrap items-end gap-3">
				<p className="font-serif text-[34px] leading-none text-ink md:text-[52px]">
					{formatCents(fund.currentAmount, { currency: currencyCode })}
				</p>
				<p className="pb-1 text-sm text-qp-text">
					de {formatCents(fund.targetAmount, { currency: currencyCode })} ·{" "}
					{EMERGENCY_FUND_TARGET_SUFFIX}
				</p>
			</div>

			<div className="relative mt-5 h-3 overflow-hidden rounded-lg bg-qp-track">
				<div
					className="h-full rounded-lg bg-gradient-to-r from-moss-soft to-moss"
					style={{ width: `${fund.progressPercent}%` }}
				/>
			</div>

			<div className="relative mt-2.5 flex flex-wrap items-center justify-between gap-2 text-[13px]">
				<span className="font-semibold text-qp-deep">{fund.monthsCoveredCopy}</span>
				{fund.cycleContributionCents > 0 ? (
					<span className="text-mute">
						{EMERGENCY_FUND_AUTO_CONTRIBUTION_PREFIX}{" "}
						{formatCents(fund.cycleContributionCents, {
							currency: currencyCode,
						})}{" "}
						{EMERGENCY_FUND_AUTO_CONTRIBUTION_SUFFIX}
					</span>
				) : null}
			</div>
		</>
	);

	const preTractionContent = (
		<>
			<div className="mb-4 flex items-center gap-2.5">
				<span className="flex size-8 items-center justify-center rounded-[9px] bg-moss text-white">
					<Lock size={13} aria-hidden />
				</span>
				<span className="text-base font-semibold text-ink">{EMERGENCY_FUND_LABEL}</span>
				<span className="rounded-full bg-qp-panel px-2.5 py-0.5 text-[10.5px] font-semibold text-qp-deep">
					{EMERGENCY_FUND_START_BADGE}
				</span>
			</div>

			<div className="flex flex-wrap items-end gap-3">
				<p className="font-serif text-[34px] leading-none text-ink md:text-[52px]">
					{formatCents(fund.currentAmount, { currency: currencyCode })}
				</p>
				<p className="pb-1 text-sm text-qp-text">
					{EMERGENCY_FUND_SUGGESTED_TARGET_PREFIX}{" "}
					{formatCents(fund.targetAmount, { currency: currencyCode })}, tres meses de tus gastos
				</p>
			</div>

			<progress
				className="mt-5 block h-3 w-full overflow-hidden rounded-lg bg-qp-track [&::-moz-progress-bar]:bg-moss [&::-webkit-progress-bar]:bg-qp-track [&::-webkit-progress-value]:bg-moss"
				value={0}
				max={100}
				aria-label="Progreso del fondo de emergencia"
			/>

			<p className="mt-2.5 text-[13px] text-mute md:hidden">
				{EMERGENCY_FUND_PRE_TRACTION_BODY_MOBILE}
			</p>
			<p className="mt-2.5 hidden text-[13px] text-mute md:block">
				{EMERGENCY_FUND_PRE_TRACTION_BODY}
			</p>

			<div className="mt-5 flex flex-col gap-2.5 sm:flex-row">
				{!hasActiveCycle ? (
					<Link href="/income/register" className={cn(buttonVariants(), "w-full sm:w-auto")}>
						{SAVINGS_EMPTY_CTA}
					</Link>
				) : (
					<Link href={detailHref} className={cn(buttonVariants(), "w-full sm:w-auto")}>
						{EMERGENCY_FUND_ACTIVATE_CTA}
					</Link>
				)}
				<button
					type="button"
					disabled
					title={EMERGENCY_FUND_START_SMALL_HINT}
					className={cn(buttonVariants({ variant: "outline" }), "w-full sm:w-auto")}
				>
					{EMERGENCY_FUND_START_SMALL_CTA}
				</button>
			</div>
		</>
	);

	const content = isPreTraction ? preTractionContent : tractionContent;

	if (isPreTraction) {
		return (
			<article className="mb-5 rounded-xl border border-line/70 bg-gradient-to-br from-canvas to-surface-soft p-5 md:mb-[22px] md:p-7">
				{content}
			</article>
		);
	}

	return (
		<article className="relative mb-5 overflow-hidden rounded-xl border border-qp-shield-line bg-gradient-to-br from-qp-shield-from to-qp-shield-to p-5 md:mb-[22px] md:p-7">
			{detailHref ? (
				<Link
					href={detailHref}
					className="block rounded-[20px] outline-none focus-visible:ring-2 focus-visible:ring-qp-selected"
				>
					{content}
				</Link>
			) : (
				content
			)}
		</article>
	);
}
