import { useRouter } from "expo-router";
import AppShell from "@/shared/components/app-shell";
import { ProgressBody } from "@/shared/components/savings/progress-body";

export default function ProgressPage() {
	const router = useRouter();
	return (
		<AppShell>
			<ProgressBody onOpenAhorro={() => router.push("/(tabs)/envelopes/ahorro")} />
		</AppShell>
	);
}
