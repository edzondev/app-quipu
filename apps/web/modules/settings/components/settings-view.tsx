"use client";

import { useMutation } from "convex/react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { authClient } from "@/auth/auth-client";
import { api } from "@/convex/_generated/api";
import { AnalyticsEvents, track } from "@/core/analytics";
import { useMyProfile } from "@/modules/auth/hooks/use-my-profile";
import { getInitial } from "@/modules/dashboard/lib/dashboard-math";
import { buttonVariants } from "@/shared/components/ui/button-variants";
import { ListRowChevron } from "@/shared/components/ui/list-row-chevron";
import { Skeleton } from "@/shared/components/ui/skeleton";
import { PLAN_LABELS, plusMonthlyPriceLabel } from "@/shared/constants/plan";
import { cn } from "@/shared/lib/utils";
import {
	SETTINGS_CHECKOUT_SUCCESS,
	SETTINGS_ERROR_BODY,
	SETTINGS_ERROR_RETRY,
	SETTINGS_ERROR_TITLE,
	SETTINGS_MOBILE_ACCOUNT_LABEL,
	SETTINGS_PAGE_SUBTITLE,
	SETTINGS_PAGE_TITLE,
	SETTINGS_PLAN_ACTIVE_BADGE,
	SETTINGS_PLAN_LABEL,
	SETTINGS_PROFILE_LABEL,
	SETTINGS_SECURITY_LABEL,
	SETTINGS_SIGN_OUT,
} from "../constants";
import { mapConvexSettingsOverview } from "../lib/buildSettingsOverview";
import { useSettingsCommitments, useSettingsOverview } from "../queries";
import { SettingsAccountActions } from "./settings-account-actions";
import { SettingsPlanCard } from "./settings-plan-card";
import { SettingsProfileCard } from "./settings-profile-card";
import { SettingsSecurityCard } from "./settings-security-card";
import { SettingsSystemGoCard } from "./settings-system-go-card";
import { SettingsSystemHubList } from "./settings-system-hub-list";

/** Canon bloque 9 "Cargando": perfil + plan a la izquierda, seguridad
 *  a la derecha. */
function SettingsViewSkeleton() {
	return (
		<div
			role="status"
			aria-label="Abriendo ajustes"
			className="mx-auto w-full max-w-6xl px-4 py-6 md:px-8 md:py-8"
		>
			<Skeleton className="h-[30px] w-[150px] rounded-lg" />
			<Skeleton variant="line" className="mt-2 h-[13px] w-[280px] max-w-full rounded-[5px]" />
			<div className="mt-6 flex flex-col gap-3.5 lg:flex-row">
				<div className="flex flex-1 flex-col gap-3.5">
					<Skeleton className="h-[150px] rounded-xl" />
					<Skeleton className="h-[150px] rounded-xl [animation-delay:150ms]" />
				</div>
				<Skeleton className="h-[230px] rounded-xl [animation-delay:300ms] lg:self-start" />
			</div>
		</div>
	);
}

function MobileAccountSummary({
	name,
	plan,
	currencyCode,
}: {
	name: string;
	plan: "free" | "premium";
	currencyCode: string;
}) {
	const planLine =
		plan === "premium"
			? `${PLAN_LABELS.premium} · ${plusMonthlyPriceLabel(currencyCode)}`
			: PLAN_LABELS.free;

	return (
		<div className="mb-3 flex items-center gap-3">
			<span className="flex size-12 shrink-0 items-center justify-center rounded-full bg-qp-tint font-serif text-[21px] text-qp-deep">
				{getInitial(name)}
			</span>
			<div className="min-w-0">
				<div className="truncate text-base font-semibold text-ink">{name}</div>
				<div className="truncate text-xs text-mute-subtle">{planLine}</div>
			</div>
		</div>
	);
}

function MobileAccountList({
	passkeyCount,
	isPremium,
}: {
	passkeyCount: number;
	isPremium: boolean;
}) {
	return (
		<div className="mb-2.5 rounded-xl border border-line/70 bg-card px-4 py-0.5">
			<Link
				href="/settings/account#perfil"
				className="flex min-h-11 items-center gap-2 border-b border-line/50 py-2.5 transition-colors hover:bg-surface-warm/40"
			>
				<span className="min-w-0 flex-1 truncate text-[13.5px] text-ink">
					{SETTINGS_PROFILE_LABEL}
				</span>
				<ListRowChevron />
			</Link>
			<Link
				href="/settings/account#plan"
				className="flex min-h-11 items-center gap-2 border-b border-line/50 py-2.5 transition-colors hover:bg-surface-warm/40"
			>
				<span className="min-w-0 flex-1 truncate text-[13.5px] text-ink">
					{SETTINGS_PLAN_LABEL}
				</span>
				{isPremium ? (
					<span className="shrink-0 rounded-full bg-qp-soft px-2 py-0.5 text-[11px] font-semibold text-qp-deep">
						{SETTINGS_PLAN_ACTIVE_BADGE}
					</span>
				) : null}
				<ListRowChevron />
			</Link>
			<Link
				href="/settings/account#seguridad"
				className="flex min-h-11 items-center gap-2 border-b border-line/50 py-2.5 transition-colors hover:bg-surface-warm/40"
			>
				<span className="min-w-0 flex-1 truncate text-[13.5px] text-ink">
					{SETTINGS_SECURITY_LABEL}
				</span>
				{passkeyCount > 0 ? (
					<span className="shrink-0 text-[11px] text-faint">{passkeyCount}</span>
				) : null}
				<ListRowChevron />
			</Link>
		</div>
	);
}

function MobileHubSignOut() {
	const router = useRouter();

	return (
		<div className="rounded-xl border border-line/70 bg-card px-4">
			<button
				type="button"
				className="flex min-h-11 w-full items-center py-2.5 text-left text-[13.5px] text-danger-ink"
				onClick={() => {
					void (async () => {
						track(AnalyticsEvents.USER_LOGGED_OUT, {});
						await authClient.signOut();
						router.push("/sign-in");
						router.refresh();
					})();
				}}
			>
				{SETTINGS_SIGN_OUT}
			</button>
		</div>
	);
}

export function SettingsView() {
	const settingsData = useSettingsOverview();
	const profile = useMyProfile();
	const commitments = useSettingsCommitments();
	const searchParams = useSearchParams();
	const checkoutSuccess = searchParams.get("checkout") === "success";
	const [showCheckoutBanner] = useState(checkoutSuccess);
	const reconcileMyPlan = useMutation(api.billing.reconcileMyPlan);
	const checkoutTracked = useRef(false);

	const shouldReconcileCheckout =
		checkoutSuccess && settingsData !== undefined && settingsData !== null;

	useEffect(() => {
		if (!shouldReconcileCheckout) return;
		void reconcileMyPlan({});
		window.history.replaceState(null, "", `${window.location.pathname}#plan`);
		if (checkoutTracked.current) return;
		checkoutTracked.current = true;
		const overview =
			settingsData !== undefined && settingsData !== null
				? mapConvexSettingsOverview(settingsData)
				: null;
		if (overview) {
			track(AnalyticsEvents.PLUS_CHECKOUT_COMPLETED, {
				currency: overview.subscription.currencyCode,
			});
		}
	}, [shouldReconcileCheckout, reconcileMyPlan, settingsData]);

	const passkeysQuery = authClient.useListPasskeys();
	const passkeyCount = passkeysQuery.data?.length ?? 0;

	if (settingsData === undefined) {
		return <SettingsViewSkeleton />;
	}

	if (settingsData === null) {
		return (
			<div className="mx-auto w-full max-w-6xl px-4 py-6 md:px-8 md:py-8">
				<section className="rounded-[14px] border border-danger-line bg-danger-bg p-5 md:p-6">
					<h2 className="text-base font-semibold text-danger-ink">{SETTINGS_ERROR_TITLE}</h2>
					<p className="mt-2 text-sm text-danger-text">{SETTINGS_ERROR_BODY}</p>
					<button
						type="button"
						className={cn(
							buttonVariants({ variant: "outline" }),
							"mt-4 border-danger-line text-danger-ink hover:bg-danger-banner",
						)}
						onClick={() => window.location.reload()}
					>
						{SETTINGS_ERROR_RETRY}
					</button>
				</section>
			</div>
		);
	}

	const overview = mapConvexSettingsOverview(settingsData);
	const commitmentCount = commitments?.length ?? 0;

	return (
		<div className="mx-auto w-full max-w-6xl px-4 py-6 md:px-8 md:py-8">
			{/* Mobile hub — canon: lista tranquila cuenta + sistema */}
			<div className="md:hidden">
				<MobileAccountSummary
					name={overview.profile.name}
					plan={overview.profile.plan}
					currencyCode={overview.subscription.currencyCode}
				/>

				<p className="mb-2 text-[12.5px] font-medium text-ink-secondary">
					{SETTINGS_MOBILE_ACCOUNT_LABEL}
				</p>
				<MobileAccountList
					passkeyCount={passkeyCount}
					isPremium={overview.profile.plan === "premium"}
				/>

				<SettingsSystemGoCard className="mt-3.5 mb-2.5" />
				{profile ? (
					<SettingsSystemHubList
						needs={profile.allocationNeeds}
						wants={profile.allocationWants}
						savings={profile.allocationSavings}
						cycleDays={profile.cycleDurationDays ?? 30}
						commitmentCount={commitmentCount}
					/>
				) : (
					<Skeleton className="h-[200px] rounded-xl" />
				)}

				<div className="mt-2.5">
					<MobileHubSignOut />
				</div>
			</div>

			{/* Desktop — cuenta; sistema vía card primaria → /settings/system */}
			<div className="hidden md:block">
				<header className="mb-5">
					<h1 className="font-serif text-[27px] font-medium text-ink">{SETTINGS_PAGE_TITLE}</h1>
					<p className="mt-1 text-[13.5px] text-mute-subtle">{SETTINGS_PAGE_SUBTITLE}</p>
				</header>

				<SettingsSystemGoCard className="mb-5" />

				<div className="grid min-w-0 grid-cols-1 gap-3.5 lg:grid-cols-[minmax(0,1fr)_min(28rem,100%)] lg:gap-4">
					<div className="flex min-w-0 flex-col gap-3.5">
						<SettingsProfileCard id="perfil" profile={overview.profile} />
						<div id="plan" className="min-w-0 scroll-mt-6">
							<SettingsPlanCard subscription={overview.subscription} />
							{showCheckoutBanner ? (
								<p className="mt-2 text-[12.5px] leading-snug text-mute-subtle" role="status">
									{SETTINGS_CHECKOUT_SUCCESS}
								</p>
							) : null}
						</div>
					</div>
					<div className="min-w-0">
						<SettingsSecurityCard
							id="seguridad"
							sessionsApiReady={overview.sessionsApiReady}
							activeSessionCount={overview.activeSessionCount}
						/>
					</div>
				</div>

				<SettingsAccountActions />
			</div>
		</div>
	);
}
