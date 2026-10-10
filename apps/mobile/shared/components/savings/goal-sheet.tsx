import { BottomSheet } from "@/shared/components/ui/bottom-sheet";
import { SheetHost } from "@/shared/components/ui/sheet-host";
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
			snapPoints={[{ fraction: 0.6 }]}
			contentPadding={0}
			containerColorClassName="accent-background"
		>
			<SheetHost>
				<GoalForm key={session} onCancel={onDismiss} onSubmit={onSubmit} />
			</SheetHost>
		</BottomSheet>
	);
}
