import { BottomSheet, RNHostView } from "@expo/ui";
import type { CreateSavingsGoalArgs } from "@/shared/lib/savings/model";
import { GoalForm } from "./goal-form";

type Props = {
	isPresented: boolean;
	session: number;
	onDismiss: () => void;
	onSubmit: (args: CreateSavingsGoalArgs) => Promise<void>;
};

export function GoalSheet({ isPresented, session, onDismiss, onSubmit }: Props) {
	return (
		<BottomSheet
			isPresented={isPresented}
			onDismiss={onDismiss}
			snapPoints={["full"]}
			contentPadding={0}
			containerColor="#FBFAF7"
		>
			<RNHostView>
				<GoalForm key={session} onCancel={onDismiss} onSubmit={onSubmit} />
			</RNHostView>
		</BottomSheet>
	);
}
