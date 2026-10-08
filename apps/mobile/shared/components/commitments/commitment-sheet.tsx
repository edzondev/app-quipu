import { BottomSheet, RNHostView } from "@expo/ui";
import type { CreateCommitmentArgs } from "@/shared/lib/commitments/model";
import { CommitmentForm } from "./commitment-form";

type Props = {
	isPresented: boolean;
	session: number;
	onDismiss: () => void;
	onSubmit: (args: CreateCommitmentArgs) => Promise<void>;
};

export function CommitmentSheet({ isPresented, session, onDismiss, onSubmit }: Props) {
	return (
		<BottomSheet
			isPresented={isPresented}
			onDismiss={onDismiss}
			snapPoints={["full"]}
			contentPadding={0}
			containerColor="#FBFAF7"
		>
			<RNHostView>
				<CommitmentForm key={session} onCancel={onDismiss} onSubmit={onSubmit} />
			</RNHostView>
		</BottomSheet>
	);
}
