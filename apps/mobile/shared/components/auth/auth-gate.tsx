import { Redirect } from "expo-router";
import type { ReactNode } from "react";
import { authClient } from "@/lib/auth-client";

export default function AuthGate({ children }: { children: ReactNode }) {
	const { data: session, isPending } = authClient.useSession();

	if (isPending) return null;

	if (!session) return <Redirect href="/sign-in" />;

	return <>{children}</>;
}
