import { useRouter } from "expo-router";
import AppShell from "@/shared/components/app-shell";
import { ProgressPreviewPicker } from "@/shared/components/progress/progress-preview-picker";
import { ProgressScreen } from "@/shared/components/progress/progress-screen";
import { useProgress } from "@/shared/hooks/use-progress";

export default function ProgressPage() {
	const router = useRouter();
	const progress = useProgress();

	return (
		<AppShell>
			<ProgressPreviewPicker />
			<ProgressScreen
				status={progress.status}
				model={progress.progress}
				onOpenClose={() => router.push("/(tabs)/savings/cierre")}
				onOpenPlan={() => router.push("/(tabs)/envelopes")}
			/>
		</AppShell>
	);
}
