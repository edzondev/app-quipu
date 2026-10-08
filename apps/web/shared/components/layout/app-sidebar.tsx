"use client";

import { AppNavContent } from "@/shared/components/layout/app-nav-content";
import { cn } from "@/shared/lib/utils";

type Props = {
	profileName?: string;
	plan?: "free" | "premium";
	className?: string;
};

export function AppSidebar({ profileName, plan = "free", className }: Props) {
	return (
		<div className={cn("flex h-full w-57 flex-col border-r border-line px-4 py-6", className)}>
			<AppNavContent profileName={profileName} plan={plan} />
		</div>
	);
}
