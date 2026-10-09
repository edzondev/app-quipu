import { BottomSheet } from "@/shared/components/ui/bottom-sheet";
import { SheetHost } from "@/shared/components/ui/sheet-host";
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
			containerColorClassName="accent-background"
		>
			<SheetHost>
				<CommitmentForm key={session} onCancel={onDismiss} onSubmit={onSubmit} />
			</SheetHost>
		</BottomSheet>
	);
}
