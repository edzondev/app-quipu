"use client";

import { useQuery } from "convex/react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { api } from "@/convex/_generated/api";
import { AnalyticsEvents, track } from "@/core/analytics";
import { fromConvexError } from "@/core/errors";
import { PremiumLockCard } from "@/shared/components/premium-lock-card";
import { buttonVariants } from "@/shared/components/ui/button-variants";
import { cn } from "@/shared/lib/utils";
import { useCreateSpace } from "../actions";
import {
	ESPACIOS_EMPTY_BODY,
	ESPACIOS_EMPTY_TITLE,
	ESPACIOS_NO_PROFILE_BODY,
	ESPACIOS_PAGE_EYEBROW,
	ESPACIOS_PAGE_SUBTITLE,
	ESPACIOS_PAGE_TITLE,
	ESPACIOS_STUB_BANNER,
} from "../constants";
import { formatSpaceRole, formatSpaceStatus } from "../lib/space-status-labels";
import { useMySpaces } from "../queries";
import { EspaciosLoadingSkeleton } from "./espacios-loading-skeleton";
import { SpaceCreateDialog } from "./space-create-dialog";
import { SpacePageShell } from "./space-page-shell";

export function EspaciosHubView() {
	const router = useRouter();
	const profile = useQuery(api.profiles.getMyProfile, {});
	const spaces = useMySpaces();
	const createSpace = useCreateSpace();
	const [createOpen, setCreateOpen] = useState(false);
	const isPremium = profile?.plan === "premium";
	const spaceList = spaces ?? [];
	const hubTracked = useRef(false);

	useEffect(() => {
		if (profile === undefined || spaces === undefined || hubTracked.current) {
			return;
		}
		hubTracked.current = true;
		track(AnalyticsEvents.ESPACIOS_HUB_VIEWED, {
			has_space: spaceList.length > 0,
			is_premium: profile?.plan === "premium",
			space_count: spaceList.length,
		});
	}, [profile, spaces, spaceList.length]);

	if (profile === null) {
		return (
			<SpacePageShell
				eyebrow={ESPACIOS_PAGE_EYEBROW}
				title={ESPACIOS_PAGE_TITLE}
				subtitle={ESPACIOS_PAGE_SUBTITLE}
			>
				<section className="mt-8 rounded-xl border border-line/70 bg-card px-5 py-5">
					<h2 className="font-serif text-lg text-ink">{ESPACIOS_EMPTY_TITLE}</h2>
					<p className="mt-1.5 text-sm leading-relaxed text-mute">{ESPACIOS_NO_PROFILE_BODY}</p>
				</section>
			</SpacePageShell>
		);
	}

	if (profile === undefined || spaces === undefined) {
		return <EspaciosLoadingSkeleton />;
	}

	return (
		<SpacePageShell
			eyebrow={ESPACIOS_PAGE_EYEBROW}
			title={ESPACIOS_PAGE_TITLE}
			subtitle={ESPACIOS_PAGE_SUBTITLE}
		>
			{profile && !profile.onboardingComplete ? (
				<p className="mt-6 rounded-xl border border-line/70 bg-surface-warm px-4 py-3 text-sm leading-relaxed text-mute">
					{ESPACIOS_STUB_BANNER}{" "}
					<Link
						href="/onboarding"
						className="font-medium text-qp-deep underline-offset-2 hover:underline"
					>
						Configurar ahora
					</Link>
				</p>
			) : null}

			<div className="mt-8 space-y-2.5">
				{spaceList.length === 0 ? (
					<section className="rounded-xl border border-line/70 bg-card px-5 py-5">
						<h2 className="font-serif text-lg text-ink">{ESPACIOS_EMPTY_TITLE}</h2>
						<p className="mt-1.5 text-sm leading-relaxed text-mute">{ESPACIOS_EMPTY_BODY}</p>
					</section>
				) : (
					spaceList.map((space) => (
						<Link
							key={space.spaceId}
							href={`/espacios/${space.spaceId}`}
							className="group block rounded-xl border border-line/70 bg-card px-5 py-4 transition-colors hover:border-line hover:bg-surface-warm/40"
						>
							<div className="flex items-start justify-between gap-4">
								<div className="min-w-0">
									<h2 className="font-serif text-[17px] text-ink transition-colors group-hover:text-qp-deep">
										{space.name}
									</h2>
									<p className="mt-1 text-[13px] text-mute">
										{formatSpaceRole(space.role)} · {formatSpaceStatus(space.status)}
									</p>
								</div>
								<span
									className="shrink-0 rounded-md bg-surface-warm px-2 py-1 text-sm text-ink-secondary"
									title={`Moneda ${space.currencyCode}`}
								>
									{space.currencySymbol}
								</span>
							</div>
						</Link>
					))
				)}
			</div>

			{spaceList.length === 0 ? (
				isPremium ? (
					<button
						type="button"
						className={cn(buttonVariants({ variant: "default" }), "mt-6")}
						onClick={() => setCreateOpen(true)}
					>
						Crear espacio compartido
					</button>
				) : (
					<PremiumLockCard
						className="mt-6"
						title="Espacios compartidos"
						body="Crea espacios financieros compartidos con tu pareja, con presupuesto del hogar aislado del personal."
						currencyCode={profile?.currencyCode}
						espaciosPaywallSurface="hub"
					/>
				)
			) : null}

			<SpaceCreateDialog
				open={createOpen}
				onOpenChange={setCreateOpen}
				onSubmit={async (name) => {
					try {
						const spaceId = await createSpace({ name });
						track(AnalyticsEvents.SPACE_CREATED, { space_id: spaceId });
						toast.success("Espacio creado");
						router.push(`/espacios/${spaceId}`);
					} catch (error) {
						toast.error(fromConvexError(error).message);
						throw error;
					}
				}}
			/>
		</SpacePageShell>
	);
}
