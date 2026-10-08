import type { Metadata } from "next";
import { requireUnauthenticatedSession } from "@/auth/auth-server";
import { pageMetadata } from "@/core/seo";
import { ResetPasswordView } from "@/modules/auth/components/reset-password-view";

export const metadata: Metadata = pageMetadata({
	title: "Nueva contraseña",
	description: "Elige una contraseña nueva para tu cuenta Quipu.",
	path: "/restablecer-contrasena",
	index: false,
});

export default async function RestablecerContrasenaPage({
	searchParams,
}: {
	searchParams: Promise<{ token?: string; error?: string }>;
}) {
	await requireUnauthenticatedSession();
	const { token, error } = await searchParams;
	const invalidFromCallback = error === "INVALID_TOKEN";
	return <ResetPasswordView token={invalidFromCallback ? null : (token ?? null)} />;
}
