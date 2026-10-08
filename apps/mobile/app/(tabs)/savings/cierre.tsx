import { useRouter } from "expo-router";
import AppShell from "@/shared/components/app-shell";
import { CloseScreen } from "@/shared/components/progress/close-screen";
import { useProgress } from "@/shared/hooks/use-progress";

export default function ClosePage() {
	const router = useRouter();
	const progress = useProgress();

	return (
		<AppShell>
			<CloseScreen status={progress.status} model={progress.close} onBack={() => router.back()} />
		</AppShell>
	);
}
