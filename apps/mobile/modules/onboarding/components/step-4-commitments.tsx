import { useForm, useStore } from "@tanstack/react-form";
import { useRef } from "react";
import { Pressable, Text, View } from "react-native";
import { CommitmentRow } from "@/modules/onboarding/components/commitment-row";
import { MonoLabel } from "@/modules/onboarding/components/mono-label";
import { WizardShell } from "@/modules/onboarding/components/wizard-shell";
import { useOnboarding } from "@/modules/onboarding/onboarding-provider";
import AuthButton from "@/shared/components/auth/auth-button";
import { COMMITMENT_QUICK_NAMES } from "@/shared/lib/commitments/model";
import {
	commitmentsFromRows,
	rowsFromCommitments,
	validCommitmentsTotalCents,
} from "@/shared/lib/onboarding/commitments";
import { formatSoles } from "@/shared/lib/onboarding/daily";

export function Step4Commitments() {
	const { state, dispatch } = useOnboarding();
	const rowKey = useRef(0);
	const form = useForm({
		defaultValues: { rows: rowsFromCommitments(state.commitments) },
		onSubmit: ({ value }) => {
			dispatch({ type: "UPDATE", payload: { commitments: commitmentsFromRows(value.rows) } });
			dispatch({ type: "SET_STEP", payload: 5 });
		},
	});
	const rows = useStore(form.store, (store) => store.values.rows);
	const totalCents = validCommitmentsTotalCents(commitmentsFromRows(rows));

	const skip = () => {
		dispatch({ type: "UPDATE", payload: { commitments: [] } });
		dispatch({ type: "SET_STEP", payload: 5 });
	};

	return (
		<WizardShell
			stepNumber={4}
			footer={
				<View className="gap-3">
					<AuthButton label="Continuar" onPress={() => void form.handleSubmit()} />
					<Pressable
						testID="commitments-skip"
						accessibilityRole="button"
						accessibilityLabel="Después"
						onPress={skip}
						className="items-center py-2 active:opacity-60"
					>
						<Text className="font-hanken-semibold text-[13px] text-foreground/55">Después</Text>
					</Pressable>
				</View>
			}
		>
			<View className="gap-6">
				<View className="gap-1">
					<Text className="font-newsreader text-[28px] text-foreground">
						¿Qué pagas todos los meses?
					</Text>
					<Text className="font-hanken text-[14px] text-foreground/55">
						Los reservamos de Necesidades para que nunca aparezcan como sorpresa.
					</Text>
				</View>

				<View className="flex-row flex-wrap gap-2">
					{COMMITMENT_QUICK_NAMES.map((name) => (
						<Pressable
							key={name}
							testID={`chip-${name.toLowerCase()}`}
							accessibilityRole="button"
							accessibilityLabel={`Agregar ${name}`}
							onPress={() => {
								rowKey.current += 1;
								form.pushFieldValue("rows", {
									key: `row-${rowKey.current}`,
									name,
									amountRaw: "",
									dueDay: "",
								});
							}}
							className="rounded-full border border-dashed border-line px-3.5 py-2 active:opacity-60"
						>
							<Text className="font-hanken text-[13px] text-foreground/70">{`+ ${name}`}</Text>
						</Pressable>
					))}
				</View>

				<form.Field name="rows">
					{(field) =>
						field.state.value.length > 0 ? (
							<View className="gap-3">
								{field.state.value.map((row, index) => (
									<CommitmentRow
										key={row.key}
										index={index}
										row={row}
										onChange={(next) => {
											const updated = field.state.value.slice();
											updated[index] = next;
											field.handleChange(updated);
										}}
										onRemove={() => {
											void form.removeFieldValue("rows", index);
										}}
									/>
								))}
							</View>
						) : null
					}
				</form.Field>

				<Text className="font-hanken text-[13px] text-foreground/45">
					Si falta el monto o el día, esa fila no se guarda.
				</Text>

				<View className="flex-row items-center justify-between">
					<MonoLabel>Se reserva de Necesidades</MonoLabel>
					<Text
						testID="commitments-total"
						className="font-hanken-semibold text-[13px] text-foreground"
					>
						{formatSoles(totalCents)}
					</Text>
				</View>
			</View>
		</WizardShell>
	);
}
