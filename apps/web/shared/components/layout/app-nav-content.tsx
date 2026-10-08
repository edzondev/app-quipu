"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Logout } from "reicon-react/icons/Logout";
import { AnalyticsEvents, track } from "@/core/analytics";
import { getInitial } from "@/modules/dashboard/lib/dashboard-math";
import {
	SETTINGS_FEEDBACK_HINT,
	SETTINGS_FEEDBACK_LABEL,
	SETTINGS_SIDEBAR_PLUS_LINK,
	SETTINGS_SIGN_OUT,
} from "@/modules/settings/constants";
import { AppNavIcon } from "@/shared/components/app-nav-icon";
import { QuipuLogo } from "@/shared/components/quipu-logo";
import { ThemeToggleButton } from "@/shared/components/theme-toggle-button";
import { SIDEBAR_ITEMS } from "@/shared/constants/navigation";
import { navItemActive } from "@/shared/lib/nav-item-active";
import { useSignOut } from "@/shared/lib/use-sign-out";
import { cn } from "@/shared/lib/utils";

type Props = {
	profileName?: string;
	plan?: "free" | "premium";
	onNavigate?: () => void;
	className?: string;
};

function isFeedbackRoute(pathname: string) {
	return pathname.startsWith("/settings/feedback");
}

function NavFeedbackLink({
	variant,
	onNavigate,
}: {
	variant: "sidebar" | "drawer";
	onNavigate?: () => void;
}) {
	const pathname = usePathname();
	if (isFeedbackRoute(pathname)) return null;

	return (
		<Link
			href="/settings/feedback"
			onClick={() => {
				track(AnalyticsEvents.FEEDBACK_ENTRY_CLICKED, { variant });
				onNavigate?.();
			}}
			className="group mb-3 block rounded-[10px] px-2.5 py-2 transition-colors hover:bg-qp-soft/50"
		>
			<span className="font-mono text-[9px] uppercase tracking-[0.1em] text-faint transition-colors group-hover:text-mute">
				Ayuda
			</span>
			<span className="mt-0.5 block text-[12.5px] text-mute-subtle transition-colors group-hover:text-ink-secondary">
				{SETTINGS_FEEDBACK_LABEL}
			</span>
			<span className="mt-0.5 block text-[11px] leading-snug text-faint transition-colors group-hover:text-mute">
				{SETTINGS_FEEDBACK_HINT}
			</span>
		</Link>
	);
}

export function AppNavContent({ profileName, plan = "free", onNavigate, className }: Props) {
	const pathname = usePathname();
	const signOut = useSignOut();

	return (
		<div className={cn("flex h-full flex-col", className)}>
			<QuipuLogo className="mb-7 px-2" />

			<nav className="flex flex-col gap-1">
				{SIDEBAR_ITEMS.map((item) => {
					const active = !item.disabled && navItemActive(pathname, item.href);
					const content = (
						<>
							<AppNavIcon label={item.label} active={active} />
							<span>{item.label}</span>
						</>
					);

					const itemClassName = cn(
						"flex items-center gap-3 rounded-[10px] px-3 py-2.5 text-sm transition-colors",
						active
							? "bg-qp-selected font-semibold text-ink"
							: "text-ink-secondary hover:bg-qp-soft",
						item.disabled && "cursor-not-allowed opacity-70",
					);

					if (item.disabled) {
						return (
							<span key={item.label} className={itemClassName} aria-disabled>
								{content}
							</span>
						);
					}

					return (
						<Link
							key={item.label}
							href={item.href}
							className={itemClassName}
							aria-current={active ? "page" : undefined}
							onClick={onNavigate}
						>
							{content}
						</Link>
					);
				})}
			</nav>

			<div className="mt-auto border-t border-line-divider pt-3">
				<NavFeedbackLink variant={onNavigate ? "drawer" : "sidebar"} onNavigate={onNavigate} />
				<div className="flex items-center gap-3 px-2.5 py-2.5">
					<span className="flex size-[34px] shrink-0 items-center justify-center rounded-full bg-qp-soft font-serif text-base text-qp-deep">
						{getInitial(profileName ?? "Quipu")}
					</span>
					<div className="min-w-0 flex-1 leading-tight">
						<div className="truncate text-[13.5px] font-semibold text-ink">
							{profileName ?? "Quipu"}
						</div>
						{plan === "free" ? (
							<Link
								href="/settings#plan"
								className="mt-0.5 inline-block text-[11px] font-medium text-qp-deep transition-colors hover:underline"
								onClick={onNavigate}
							>
								{SETTINGS_SIDEBAR_PLUS_LINK}
							</Link>
						) : null}
					</div>
					<ThemeToggleButton />
				</div>
				<button
					type="button"
					onClick={signOut}
					className="flex w-full items-center gap-2 rounded-[10px] px-2.5 py-2 text-[11.5px] text-mute transition-colors hover:bg-qp-soft hover:text-ink"
				>
					<Logout size={13} color="currentColor" aria-hidden />
					{SETTINGS_SIGN_OUT}
				</button>
			</div>
		</div>
	);
}
