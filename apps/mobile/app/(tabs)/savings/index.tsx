import { useRouter } from "expo-router";
import { ProgressScreen } from "@/shared/components/progress/progress-screen";
import { useProgress } from "@/shared/hooks/use-progress";

export default function ProgressPage() {
	const router = useRouter();
	const progress = useProgress();

	return (
		<ProgressScreen
			status={progress.status}
			model={progress.progress}
			onOpenClose={() => router.push("/(tabs)/savings/cierre")}
			onOpenPlan={() => router.push("/(tabs)/envelopes")}
		/>
	);
}
