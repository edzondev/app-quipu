import type { Metadata } from "next";
import { requireUnauthenticatedSession } from "@/auth/auth-server";
import { pageMetadata } from "@/core/seo";
import { VerifyEmailView } from "@/modules/auth/components/verify-email-view";

export const metadata: Metadata = pageMetadata({
	title: "Verificar correo",
	path: "/verify-email",
	index: false,
});

export default async function VerifyEmailPage() {
	await requireUnauthenticatedSession();
	return <VerifyEmailView />;
}
