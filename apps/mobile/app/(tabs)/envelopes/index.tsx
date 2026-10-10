import { useRouter } from "expo-router";
import AppShell from "@/shared/components/app-shell";
import { PlanHub } from "@/shared/components/plan/plan-hub";
import { usePlanHub } from "@/shared/hooks/use-plan-hub";

export default function EnvelopesPage() {
	const hub = usePlanHub();
	const router = useRouter();

	return (
		<AppShell>
			<PlanHub
				status={hub.status}
				model={hub.model}
				ahorro={hub.ahorro}
				onOpenSobres={() => router.push("/(tabs)/envelopes/sobres")}
				onOpenCommitments={() => router.push("/(tabs)/envelopes/compromisos")}
				onOpenAhorro={() => router.push("/(tabs)/envelopes/ahorro")}
			/>
		</AppShell>
	);
}
