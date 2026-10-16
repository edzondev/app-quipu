import { api } from "@quipu/convex-api";
import { useMutation } from "convex/react";
import { useRouter } from "expo-router";
import { useState } from "react";
import { CommitmentSheet } from "@/shared/components/commitments/commitment-sheet";
import { CommitmentsScreen } from "@/shared/components/commitments/commitments-screen";
import { useCommitments } from "@/shared/hooks/use-commitments";
import type { CreateCommitmentArgs } from "@/shared/lib/commitments/model";
import { runAction } from "@/shared/lib/network/run-action";

const SAVE_ERROR = "No se pudo guardar el compromiso.";

export default function CompromisosPage() {
	const router = useRouter();
	const commitments = useCommitments();
	const createCommitment = useMutation(api.fixedCommitments.createFixedCommitment);
	const [isPresented, setPresented] = useState(false);
	const [session, setSession] = useState(0);

	function openAdd() {
		setSession((current) => current + 1);
		setPresented(true);
	}

	async function submit(args: CreateCommitmentArgs) {
		await runAction(() => createCommitment(args), SAVE_ERROR);
		setPresented(false);
	}

	return (
		<>
			<CommitmentsScreen
				status={commitments.status}
				model={commitments.model}
				onBack={() => router.back()}
				onAdd={openAdd}
			/>
			<CommitmentSheet
				isPresented={isPresented}
				session={session}
				onDismiss={() => setPresented(false)}
				onSubmit={submit}
			/>
		</>
	);
}
