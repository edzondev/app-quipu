"use client";

import { useState } from "react";
import { AppMobileHeader } from "@/shared/components/layout/app-mobile-header";
import { AppNavContent } from "@/shared/components/layout/app-nav-content";
import { Sheet, SheetContent, SheetTitle } from "@/shared/components/ui/sheet";

type Props = {
	profileName?: string;
	plan?: "free" | "premium";
};

/** Header + left drawer; remount with key={pathname} to reset open state on route change. */
export function AppMobileNav({ profileName, plan = "free" }: Props) {
	const [open, setOpen] = useState(false);

	return (
		<>
			<AppMobileHeader onMenuClick={() => setOpen(true)} />
			<Sheet open={open} onOpenChange={setOpen}>
				<SheetContent
					side="left"
					showCloseButton
					className="w-72 max-w-[85vw] gap-0 border-r border-line bg-surface-warm p-0 sm:max-w-xs"
				>
					<SheetTitle className="sr-only">Menú de navegación</SheetTitle>
					<div className="flex h-full flex-col px-4 py-6">
						<AppNavContent
							profileName={profileName}
							plan={plan}
							onNavigate={() => setOpen(false)}
						/>
					</div>
				</SheetContent>
			</Sheet>
		</>
	);
}
