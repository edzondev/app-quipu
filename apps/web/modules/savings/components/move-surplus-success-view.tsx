"use client";

import Link from "next/link";
import { AppPageShell } from "@/shared/components/layout/app-page-shell";
import { buttonVariants } from "@/shared/components/ui/button-variants";
import { formatCents } from "@/shared/lib/money";
import { cn } from "@/shared/lib/utils";
import {
	MOVE_SURPLUS_SUCCESS_ALLOCATION_PREFIX,
	MOVE_SURPLUS_SUCCESS_BODY_PREFIX,
	MOVE_SURPLUS_SUCCESS_BODY_SUFFIX,
	MOVE_SURPLUS_SUCCESS_HOME_CTA,
	MOVE_SURPLUS_SUCCESS_METRIC_ADDITIONAL,
	MOVE_SURPLUS_SUCCESS_METRIC_OBJECTIVE,
	MOVE_SURPLUS_SUCCESS_METRIC_TOTAL,
	MOVE_SURPLUS_SUCCESS_TITLE_PREFIX,
	MOVE_SURPLUS_SUCCESS_TITLE_SUFFIX,
} from "../constants";

type Props = {
	currencyCode: string;
	movedCents: number;
	savingsObjectiveCents: number;
	savingsAdditionalCents: number;
	savingsTotalCents: number;
	allocationNeeds: number;
	allocationWants: number;
	allocationSavings: number;
};

export function MoveSurplusSuccessView({
	currencyCode,
	movedCents,
	savingsObjectiveCents,
	savingsAdditionalCents,
	savingsTotalCents,
	allocationNeeds,
	allocationWants,
	allocationSavings,
}: Props) {
	const format = (cents: number) => formatCents(cents, { currency: currencyCode });

	return (
		<AppPageShell maxWidth="2xl" breadcrumbs="auto">
			<div className="rounded-xl border border-line/70 bg-card px-6 py-10 text-center md:px-12 md:py-12">
				<div className="mx-auto mb-5 flex size-[70px] items-center justify-center rounded-full bg-moss shadow-[0_14px_34px_-14px_var(--qp-shadow-moss)]">
					<span className="mb-1 block size-4 rotate-45 border-r-4 border-b-4 border-white" />
				</div>
				<h1 className="font-serif text-[30px] font-medium text-ink">
					{MOVE_SURPLUS_SUCCESS_TITLE_PREFIX} {format(movedCents)}{" "}
					{MOVE_SURPLUS_SUCCESS_TITLE_SUFFIX}
				</h1>
				<p className="mx-auto mt-2 max-w-md text-[15px] text-mute text-pretty">
					{MOVE_SURPLUS_SUCCESS_BODY_PREFIX} {format(savingsTotalCents)}{" "}
					{MOVE_SURPLUS_SUCCESS_BODY_SUFFIX}
				</p>

				<div className="mt-7 grid gap-3 text-left md:grid-cols-3">
					<SuccessMetric
						label={MOVE_SURPLUS_SUCCESS_METRIC_OBJECTIVE}
						amount={format(savingsObjectiveCents)}
						variant="objective"
					/>
					<SuccessMetric
						label={MOVE_SURPLUS_SUCCESS_METRIC_ADDITIONAL}
						amount={format(savingsAdditionalCents)}
						variant="additional"
						amountClassName="text-qp-deep"
					/>
					<SuccessMetric
						label={MOVE_SURPLUS_SUCCESS_METRIC_TOTAL}
						amount={format(savingsTotalCents)}
						variant="total"
					/>
				</div>

				<p className="mt-5 inline-flex items-center gap-2 rounded-xl border border-qp-shield-line bg-qp-success px-4 py-3 text-sm text-qp-deep">
					<span className="size-2 rounded-full bg-moss" aria-hidden />
					{MOVE_SURPLUS_SUCCESS_ALLOCATION_PREFIX} {allocationNeeds} / {allocationWants} /{" "}
					{allocationSavings}
				</p>

				<Link
					href="/savings"
					className={cn(buttonVariants(), "mt-7 inline-flex rounded-[11px] px-8")}
				>
					{MOVE_SURPLUS_SUCCESS_HOME_CTA}
				</Link>
			</div>
		</AppPageShell>
	);
}

function SuccessMetric({
	label,
	amount,
	variant,
	amountClassName,
}: {
	label: string;
	amount: string;
	variant: "objective" | "additional" | "total";
	amountClassName?: string;
}) {
	const isTotal = variant === "total";
	return (
		<article
			className={cn(
				"rounded-xl border p-4",
				isTotal ? "border-qp-shield-line bg-qp-success" : "border-line/70 bg-card",
			)}
		>
			<div className="mb-2 flex items-center gap-2 text-[12.5px] font-medium text-ink-secondary">
				{variant !== "total" ? (
					<span
						className={cn(
							"size-2.5 rounded-sm",
							variant === "objective"
								? "bg-moss-soft"
								: "bg-[repeating-linear-gradient(45deg,var(--moss-soft,#7fb39f),var(--moss-soft,#7fb39f)_3px,#9cc6b6_3px,#9cc6b6_6px)]",
						)}
						aria-hidden
					/>
				) : null}
				<span className={isTotal ? "font-semibold text-qp-deep" : undefined}>{label}</span>
			</div>
			<p className={cn("font-serif text-[21px] text-ink", amountClassName)}>{amount}</p>
		</article>
	);
}
