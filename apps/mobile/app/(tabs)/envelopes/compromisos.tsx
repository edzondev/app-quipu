import { api } from "@quipu/convex-api";
import { useMutation } from "convex/react";
import { useRouter } from "expo-router";
import { useState } from "react";
import AppShell from "@/shared/components/app-shell";
import { CommitmentSheet } from "@/shared/components/commitments/commitment-sheet";
import { CommitmentsScreen } from "@/shared/components/commitments/commitments-screen";
import { useCommitments } from "@/shared/hooks/use-commitments";
import type { CreateCommitmentArgs } from "@/shared/lib/commitments/model";
import { readActionError } from "@/shared/lib/expenses/errors";

export default function CompromisosPage() {
	const router = useRouter();
	const commitments = useCommitments();
	const createCommitment = useMutation(api.fixedCommitments.createFixedCommitment);
	const [isPresented, setPresented] = useState(false);
	const [session, setSession] = useState(0);
	const [isSubmitting, setSubmitting] = useState(false);
	const [formError, setFormError] = useState<string | null>(null);

	function openAdd() {
		setFormError(null);
		setSession((current) => current + 1);
		setPresented(true);
	}

	async function submit(args: CreateCommitmentArgs) {
		setFormError(null);
		setSubmitting(true);
		try {
			await createCommitment(args);
			setPresented(false);
		} catch (error) {
			setFormError(readActionError(error, "No se pudo guardar el compromiso."));
		} finally {
			setSubmitting(false);
		}
	}

	return (
		<AppShell>
			<CommitmentsScreen
				status={commitments.status}
				model={commitments.model}
				onBack={() => router.back()}
				onAdd={openAdd}
			/>
			<CommitmentSheet
				isPresented={isPresented}
				session={session}
				isSubmitting={isSubmitting}
				formError={formError}
				onDismiss={() => setPresented(false)}
				onSubmit={(args) => {
					void submit(args);
				}}
			/>
		</AppShell>
	);
}
