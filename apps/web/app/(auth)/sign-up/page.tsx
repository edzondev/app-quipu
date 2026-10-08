import { requireUnauthenticatedSession } from "@/auth/auth-server";
import { pageMetadata } from "@/core/seo";
import { SignUpView } from "@/modules/auth/components/sign-up-view";

export const metadata = pageMetadata({
	title: "Crear cuenta",
	description:
		"Regístrate en Quipu y organiza tu sueldo en tres sobres antes de gastar. Passkey, sin contraseñas.",
	path: "/sign-up",
	index: true,
});

export default async function SignUpPage({
	searchParams,
}: {
	searchParams: Promise<{ email?: string; next?: string }>;
}) {
	const { email, next } = await searchParams;
	await requireUnauthenticatedSession(next);
	return <SignUpView initialEmail={email ?? ""} returnTo={next} />;
}
