import type { Metadata } from "next";
import { redirect } from "next/navigation";
import type { PropsWithChildren } from "react";
import { isAuthenticated } from "@/auth/auth-server";
import { privateAreaMetadata } from "@/core/seo";

export const metadata: Metadata = privateAreaMetadata;

/**
 * Layout del grupo `(onboarding)`.
 *
 * Por qué existe: el wizard de onboarding es **pre-app** (todavía no
 * hay profile, todavía no hay dashboard). Vive en su propio route group
 * para no contaminar `(app)` con rutas que no requieren el AppShell.
 *
 * Auth gate: si el usuario no está autenticado, redirige a `/sign-in`.
 * NO verificamos si tiene profile: el page.tsx de `/onboarding` se
 * encarga de redirigir a `/dashboard` si ya completó el onboarding.
 *
 * El layout es solo composición: no fetchea, no redirige por profile.
 * Si redirigiera acá, perderíamos la lógica de defensa en
 * `/onboarding/page.tsx` (caso 2 tabs simultáneos, ver spec §12).
 */
export default async function OnboardingLayout({ children }: PropsWithChildren) {
	const isAuthed = await isAuthenticated();
	if (!isAuthed) {
		redirect("/sign-in");
	}

	return (
		<div className="min-h-full flex-1 bg-background">
			<div className="container mx-auto w-full">{children}</div>
		</div>
	);
}
