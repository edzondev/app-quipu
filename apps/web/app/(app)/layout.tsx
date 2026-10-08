import type { Metadata } from "next";
import type { ReactNode } from "react";
import { privateAreaMetadata } from "@/core/seo";
import { AppLayoutShell } from "@/shared/components/layout/app-layout-shell";

export const metadata: Metadata = privateAreaMetadata;

/** Auth gates live in each `page.tsx` via `requireOnboardedProfile` (QUIPU-MASTER §5.4). */
export default function AppLayout({ children }: { children: ReactNode }) {
	return <AppLayoutShell>{children}</AppLayoutShell>;
}
