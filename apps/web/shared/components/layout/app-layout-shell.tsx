"use client";

import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { useMyProfile } from "@/modules/auth/hooks/use-my-profile";
import { ExpenseRegisterProvider } from "@/modules/expenses/components/expense-register-provider";
import { AppMobileNav } from "./app-mobile-nav";
import { AppSidebar } from "./app-sidebar";

type Props = {
	children: ReactNode;
};

export function AppLayoutShell({ children }: Props) {
	const profile = useMyProfile();
	const pathname = usePathname();
	const profileName = profile?.name;
	const plan = profile?.plan ?? "free";

	return (
		<ExpenseRegisterProvider>
			<div className="flex min-h-dvh bg-background">
				<AppSidebar
					profileName={profileName}
					plan={plan}
					className="sticky top-0 hidden h-dvh md:flex"
				/>
				<div className="flex min-h-dvh flex-1 flex-col">
					<AppMobileNav key={pathname} profileName={profileName} plan={plan} />
					<main className="flex-1 md:pb-8">{children}</main>
				</div>
			</div>
		</ExpenseRegisterProvider>
	);
}
