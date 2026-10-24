import { useRouter } from "expo-router";
import { useRegistrar } from "@/shared/components/navigation/registrar-context";
import { ProgressScreen } from "@/shared/components/progress/progress-screen";
import { useProgress } from "@/shared/hooks/use-progress";

export default function ProgressPage() {
	const router = useRouter();
	const progress = useProgress();
	const { openCreate } = useRegistrar();

	return (
		<ProgressScreen
			status={progress.status}
			model={progress.progress}
			onOpenClose={() => router.push("/(tabs)/savings/cierre")}
			onRegisterExpense={() => openCreate("expense")}
		/>
	);
}
