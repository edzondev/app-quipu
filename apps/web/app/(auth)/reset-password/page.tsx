import { redirect } from "next/navigation";

export default async function ResetPasswordLegacyRedirect({
	searchParams,
}: {
	searchParams: Promise<{ token?: string; error?: string }>;
}) {
	const params = await searchParams;
	const qs = new URLSearchParams();
	if (params.token) qs.set("token", params.token);
	if (params.error) qs.set("error", params.error);
	const query = qs.toString();
	redirect(`/restablecer-contrasena${query ? `?${query}` : ""}`);
}
