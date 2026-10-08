import { BottomSheet, RNHostView } from "@expo/ui";
import type { CreateCommitmentArgs } from "@/shared/lib/commitments/model";
import { CommitmentForm } from "./commitment-form";

type Props = {
	isPresented: boolean;
	session: number;
	isSubmitting?: boolean;
	formError?: string | null;
	onDismiss: () => void;
	onSubmit: (args: CreateCommitmentArgs) => void;
};

export function CommitmentSheet({
	isPresented,
	session,
	isSubmitting,
	formError,
	onDismiss,
	onSubmit,
}: Props) {
	return (
		<BottomSheet
			isPresented={isPresented}
			onDismiss={onDismiss}
			snapPoints={["full"]}
			contentPadding={0}
			containerColor="#FBFAF7"
		>
			<RNHostView>
				<CommitmentForm
					key={session}
					isSubmitting={isSubmitting}
					formError={formError}
					onCancel={onDismiss}
					onSubmit={onSubmit}
				/>
			</RNHostView>
		</BottomSheet>
	);
}
