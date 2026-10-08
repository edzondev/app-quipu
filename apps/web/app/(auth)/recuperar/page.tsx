import type { Metadata } from "next";
import { requireUnauthenticatedSession } from "@/auth/auth-server";
import { pageMetadata } from "@/core/seo";
import { ForgotPasswordView } from "@/modules/auth/components/forgot-password-view";

export const metadata: Metadata = pageMetadata({
	title: "Recuperar acceso",
	description: "Restablece tu contraseña de Quipu con un enlace seguro enviado a tu correo.",
	path: "/recuperar",
	index: false,
});

export default async function RecuperarPage({
	searchParams,
}: {
	searchParams: Promise<{ email?: string }>;
}) {
	await requireUnauthenticatedSession();
	const { email } = await searchParams;
	return <ForgotPasswordView initialEmail={email ?? ""} />;
}
