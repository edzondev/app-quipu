"use client";

import { useQuery } from "convex/react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { AnalyticsEvents, track } from "@/core/analytics";
import { buttonVariants } from "@/shared/components/ui/button-variants";
import { formatCents } from "@/shared/lib/money";
import {
	movementAmountClassName,
	movementAmountPrefix,
	movementDotClassName,
} from "@/shared/lib/movement-amount-display";
import { cn } from "@/shared/lib/utils";
import {
	ESPACIOS_CONTRIBUTE_STUB_HINT,
	ESPACIOS_HUB_ACTIONS_LABEL,
	ESPACIOS_HUB_AVAILABLE_LABEL,
	ESPACIOS_HUB_INVITE_HINT,
	ESPACIOS_HUB_MOVEMENTS_LABEL,
	ESPACIOS_HUB_NO_MOVEMENTS,
	ESPACIOS_INVITE_FROM_SETTINGS,
} from "../constants";
import { useSpaceOverview } from "../queries";
import { EspaciosLoadingSkeleton } from "./espacios-loading-skeleton";
import { SpaceAlerts } from "./space-alerts";
import { SpaceDashboardHeader } from "./space-dashboard-header";
import { SpaceEnvelopeCards } from "./space-envelope-cards";
import { SpaceMembersParticipation } from "./space-members-participation";
import { SpacePageShell } from "./space-page-shell";
import { SpaceSection } from "./space-section";

const SpaceContributeFlow = dynamic(
	() => import("./space-contribute-flow").then((mod) => mod.SpaceContributeFlow),
	{ ssr: false },
);

const SpaceExpenseFlow = dynamic(
	() => import("./space-expense-flow").then((mod) => mod.SpaceExpenseFlow),
	{ ssr: false },
);

type Props = {
	spaceId: Id<"financialSpaces">;
};

export function SpaceDashboardView({ spaceId }: Props) {
	const profile = useQuery(api.profiles.getMyProfile, {});
	const overview = useSpaceOverview(spaceId);
	const [showContribute, setShowContribute] = useState(false);
	const [showExpense, setShowExpense] = useState(false);
	const dashboardTracked = useRef<string | null>(null);
	const readonlyTracked = useRef<string | null>(null);

	useEffect(() => {
		if (overview === undefined || overview === null) return;
		if (dashboardTracked.current === spaceId) return;
		dashboardTracked.current = spaceId;
		track(AnalyticsEvents.SPACE_DASHBOARD_VIEWED, {
			space_id: spaceId,
			status: overview.space.status,
			member_count: Math.max(overview.members.length, 1),
		});
		if (
			(overview.space.status === "readonly" || overview.space.status === "closed") &&
			readonlyTracked.current !== spaceId
		) {
			readonlyTracked.current = spaceId;
			track(AnalyticsEvents.SPACE_ENTERED_READONLY, { space_id: spaceId });
		}
	}, [overview, spaceId]);

	if (overview === undefined || profile === undefined) {
		return <EspaciosLoadingSkeleton />;
	}

	if (overview === null || profile === null) {
		return (
			<SpacePageShell>
				<p className="mt-6 text-sm leading-relaxed text-mute">
					No pudimos cargar este espacio o ya no tienes acceso.
				</p>
			</SpacePageShell>
		);
	}

	const readonly = overview.space.status === "readonly" || overview.space.status === "closed";
	const canContributeFromPersonal = profile.onboardingComplete;
	const totalRemaining = overview.envelopes.reduce(
		(sum, envelope) => sum + envelope.remainingAmount,
		0,
	);
	const waitingForPartner = overview.members.length < 2;
	const showInviteHint = overview.viewerRole === "owner" && !readonly && waitingForPartner;

	return (
		<SpacePageShell>
			<SpaceDashboardHeader
				spaceId={spaceId}
				name={overview.space.name}
				allocationNeeds={overview.space.allocationNeeds}
				allocationWants={overview.space.allocationWants}
				allocationSavings={overview.space.allocationSavings}
				viewerRole={overview.viewerRole}
				status={overview.space.status}
			/>

			<div className="mt-5">
				<SpaceAlerts
					spaceId={spaceId}
					viewerProfileId={overview.viewerProfileId}
					viewerRole={overview.viewerRole}
					status={overview.space.status}
					ownerIsPremium={overview.ownerIsPremium}
					members={overview.members}
					currencyCode={overview.space.currencyCode}
					readonly={readonly}
				/>
			</div>

			<SpaceSection title={ESPACIOS_HUB_AVAILABLE_LABEL} className="mt-5" contentClassName="py-5">
				<p className="font-serif text-[30px] tracking-tight text-ink">
					{formatCents(totalRemaining, {
						currency: overview.space.currencyCode,
					})}
				</p>
			</SpaceSection>

			<SpaceEnvelopeCards
				className="mt-3"
				envelopes={overview.envelopes}
				currencyCode={overview.space.currencyCode}
			/>

			<div className="mt-3">
				<SpaceMembersParticipation
					spaceId={spaceId}
					members={overview.members}
					currencyCode={overview.space.currencyCode}
					pendingProposals={overview.pendingProposals}
					viewerProfileId={overview.viewerProfileId}
				/>
			</div>

			{showInviteHint ? (
				<p className="mt-3 text-[13px] leading-relaxed text-mute">
					{ESPACIOS_HUB_INVITE_HINT}{" "}
					<Link
						href={`/espacios/${spaceId}/configuracion`}
						className="font-medium text-qp-deep underline-offset-2 hover:underline"
					>
						{ESPACIOS_INVITE_FROM_SETTINGS}
					</Link>
				</p>
			) : null}

			{!readonly ? (
				<SpaceSection title={ESPACIOS_HUB_ACTIONS_LABEL} className="mt-3">
					<div className="flex flex-wrap gap-2">
						{canContributeFromPersonal ? (
							<button
								type="button"
								className={cn(buttonVariants({ variant: "default" }), "h-10 px-4")}
								onClick={() => setShowContribute(true)}
							>
								Aportar desde personal
							</button>
						) : null}
						<button
							type="button"
							className={cn(buttonVariants({ variant: "outline" }), "h-10 border-line px-4")}
							onClick={() => setShowExpense(true)}
						>
							Registrar gasto
						</button>
					</div>
					{!canContributeFromPersonal ? (
						<p className="mt-3 text-sm leading-relaxed text-mute">
							{ESPACIOS_CONTRIBUTE_STUB_HINT}{" "}
							<Link
								href="/onboarding"
								className="font-medium text-qp-deep underline-offset-2 hover:underline"
							>
								Configurar ahora
							</Link>
						</p>
					) : null}
				</SpaceSection>
			) : null}

			<SpaceSection title={ESPACIOS_HUB_MOVEMENTS_LABEL} className="mt-3" contentClassName="py-0">
				<ul className="divide-y divide-line/60">
					{overview.recentMovements.length === 0 ? (
						<li className="py-4 text-sm text-mute">{ESPACIOS_HUB_NO_MOVEMENTS}</li>
					) : (
						overview.recentMovements.map((movement) => (
							<li key={movement.id} className="flex items-center gap-3 py-3.5 text-sm">
								<span
									className={`size-1.5 shrink-0 rounded-full ${movementDotClassName(movement.kind)}`}
									aria-hidden
								/>
								<span className="min-w-0 flex-1 text-[13.5px] text-ink">{movement.label}</span>
								<span
									className={`min-w-20 text-right font-serif text-[15px] tabular-nums ${movementAmountClassName(movement.kind)}`}
								>
									{movementAmountPrefix(movement.kind)}{" "}
									{formatCents(movement.amount, {
										currency: overview.space.currencyCode,
									})}
								</span>
							</li>
						))
					)}
				</ul>
			</SpaceSection>

			<SpaceContributeFlow
				open={showContribute}
				onOpenChange={setShowContribute}
				spaceId={spaceId}
			/>
			<SpaceExpenseFlow
				open={showExpense}
				onOpenChange={setShowExpense}
				spaceId={spaceId}
				allowPersonalPocket={canContributeFromPersonal}
				envelopes={overview.envelopes}
				currencyCode={overview.space.currencyCode}
			/>
		</SpacePageShell>
	);
}
