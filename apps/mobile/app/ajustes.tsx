import { useRouter } from "expo-router";
import AppShell from "@/shared/components/app-shell";
import { SettingsScreen } from "@/shared/components/settings/settings-screen";
import { useSettings } from "@/shared/hooks/use-settings";

export default function AjustesPage() {
	const router = useRouter();
	const settings = useSettings();

	return (
		<AppShell>
			<SettingsScreen
				status={settings.status}
				model={settings.model}
				onClose={() => router.back()}
				onOpenSecurity={() => router.push("/seguridad")}
			/>
		</AppShell>
	);
}
