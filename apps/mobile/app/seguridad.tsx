import { useRouter } from "expo-router";
import AppShell from "@/shared/components/app-shell";
import { SecurityScreen } from "@/shared/components/settings/security-screen";
import { useSecurity } from "@/shared/hooks/use-security";
import { SIGNED_OUT_HREF } from "@/shared/lib/auth/device-session";

export default function SeguridadPage() {
	const router = useRouter();
	const security = useSecurity();

	return (
		<AppShell>
			<SecurityScreen
				status={security.status}
				model={security.model}
				onBack={() => router.back()}
				onAddPasskey={() => security.addPasskey()}
				onDeletePasskey={(id) => security.deletePasskey(id)}
				onRevokeSession={(sessionId) => security.revokeSession(sessionId)}
				onRevokeAll={() => security.revokeAllAndSignOut(() => router.replace(SIGNED_OUT_HREF))}
			/>
		</AppShell>
	);
}
