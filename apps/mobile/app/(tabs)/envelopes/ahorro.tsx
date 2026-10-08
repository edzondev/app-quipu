import { api } from "@quipu/convex-api";
import { useMutation } from "convex/react";
import { useRouter } from "expo-router";
import { useState } from "react";
import AppShell from "@/shared/components/app-shell";
import { GoalSheet } from "@/shared/components/savings/goal-sheet";
import { SavingsScreen } from "@/shared/components/savings/savings-screen";
import { useAhorro } from "@/shared/hooks/use-ahorro";
import { readActionError } from "@/shared/lib/expenses/errors";
import type { CreateSavingsGoalArgs } from "@/shared/lib/savings/model";

export default function AhorroPage() {
	const router = useRouter();
	const ahorro = useAhorro();
	const createGoal = useMutation(api.savings.createSavingsGoal);
	const moveSurplus = useMutation(api.savings.moveSurplusToSavings);
	const [isPresented, setPresented] = useState(false);
	const [session, setSession] = useState(0);
	const [surplusDismissed, setSurplusDismissed] = useState(false);
	const [movingSurplus, setMovingSurplus] = useState(false);
	const [moveError, setMoveError] = useState<string | null>(null);

	function openAdd() {
		setSession((current) => current + 1);
		setPresented(true);
	}

	async function submit(args: CreateSavingsGoalArgs) {
		await createGoal(args);
		setPresented(false);
	}

	async function onMoveSurplus() {
		const banner = ahorro.model?.surplus;
		if (!banner || movingSurplus) return;
		setMovingSurplus(true);
		setMoveError(null);
		try {
			await moveSurplus(banner.args);
			setSurplusDismissed(true);
		} catch (error) {
			setMoveError(readActionError(error, "No se pudo mover el excedente."));
		} finally {
			setMovingSurplus(false);
		}
	}

	return (
		<AppShell>
			<SavingsScreen
				status={ahorro.status}
				model={ahorro.model}
				surplusDismissed={surplusDismissed}
				movingSurplus={movingSurplus}
				moveError={moveError}
				onBack={() => router.back()}
				onAddGoal={openAdd}
				onMoveSurplus={() => void onMoveSurplus()}
				onDismissSurplus={() => setSurplusDismissed(true)}
			/>
			<GoalSheet
				isPresented={isPresented}
				session={session}
				onDismiss={() => setPresented(false)}
				onSubmit={submit}
			/>
		</AppShell>
	);
}
