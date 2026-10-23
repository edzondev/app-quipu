import { useRouter } from "expo-router";
import AppShell from "@/shared/components/app-shell";
import { ExpenseDetectionScreen } from "@/shared/components/settings/expense-detection-screen";

export default function ExpenseDetectionPage() {
	const router = useRouter();
	return (
		<AppShell>
			<ExpenseDetectionScreen onClose={() => router.back()} />
		</AppShell>
	);
}
