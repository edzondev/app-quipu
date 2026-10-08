import type { Metadata } from "next";
import { requireUnauthenticatedSession } from "@/auth/auth-server";
import { pageMetadata } from "@/core/seo";
import { SignInView } from "@/modules/auth/components/sign-in-view";

export const metadata: Metadata = pageMetadata({
	title: "Iniciar sesión",
	description:
		"Entra a Quipu con tu passkey y revisa al instante cuánto puedes gastar en Necesidades y Gustos.",
	path: "/sign-in",
	index: true,
});

export default async function SignInPage({
	searchParams,
}: {
	searchParams: Promise<{ email?: string; reason?: string; next?: string }>;
}) {
	const { email, reason, next } = await searchParams;
	await requireUnauthenticatedSession(next);
	return <SignInView initialEmail={email ?? ""} reason={reason} returnTo={next} />;
}
