import { useRouter } from "expo-router";
import { useRef } from "react";
import { Pressable, Text, View } from "react-native";
import { WizardShell } from "@/modules/onboarding/components/wizard-shell";
import { useOnboarding } from "@/modules/onboarding/onboarding-provider";
import { useCompleteOnboarding } from "@/modules/onboarding/use-complete-onboarding";
import AuthButton from "@/shared/components/auth/auth-button";
import { validCommitmentsTotalCents } from "@/shared/lib/onboarding/commitments";
import { formatSoles } from "@/shared/lib/onboarding/daily";
import { formatPayDate } from "@/shared/lib/onboarding/pay-date";

const COMMITMENTS_NOTE = "También puedes agregarlos después desde Plan.";

function SummaryRow({ label, value, testID }: { label: string; value: string; testID?: string }) {
	return (
		<View className="flex-row items-center justify-between">
			<Text className="font-hanken text-[14px] text-foreground/70">{label}</Text>
			<Text testID={testID} className="font-hanken-semibold text-[14px] text-foreground">
				{value}
			</Text>
		</View>
	);
}

function FieldError({ testID, message }: { testID: string; message: string | undefined }) {
	if (!message) return null;
	return (
		<Text testID={testID} className="font-hanken text-[13px] text-danger">
			{message}
		</Text>
	);
}

export function StepConfirm() {
	const router = useRouter();
	const { state } = useOnboarding();
	const { submit, isSubmitting, error, commitmentsFailed } = useCompleteOnboarding();
	const startLock = useRef(false);
	const balanceError = state.cycleFieldErrors.openingBalanceCents;
	const payDateError = state.cycleFieldErrors.nextPayDate;
	const showRetry = Boolean(error) || Boolean(balanceError) || Boolean(payDateError);

	const referenceCents = state.referenceIncomeCents;
	const commitmentsTotalCents = validCommitmentsTotalCents(state.commitments);

	const envelopeAmount = (pct: number) =>
		referenceCents == null ? null : Math.floor((referenceCents * pct) / 100);

	const envelopes = [
		{ key: "needs", label: "Necesidades", pct: state.allocationNeeds },
		{ key: "wants", label: "Gustos", pct: state.allocationWants },
		{ key: "savings", label: "Ahorro", pct: state.allocationSavings },
	] as const;

	const start = async () => {
		if (startLock.current) return;
		startLock.current = true;
		const ok = await submit();
		if (!ok) {
			startLock.current = false;
			return;
		}
		router.replace("/(tabs)");
	};

	return (
		<WizardShell
			stepNumber={5}
			footer={
				<View className="gap-3">
					<AuthButton
						label="Empezar mi ciclo"
						onPress={() => void start()}
						loading={isSubmitting}
						disabled={isSubmitting}
					/>
					{showRetry ? (
						<Pressable
							testID="confirm-retry"
							accessibilityRole="button"
							accessibilityLabel="Reintentar"
							onPress={() => void start()}
							disabled={isSubmitting}
							className="items-center py-2 active:opacity-60"
						>
							<Text className="font-hanken-semibold text-[13px] text-foreground">Reintentar</Text>
						</Pressable>
					) : null}
				</View>
			}
		>
			<View className="gap-6">
				<Text className="font-hanken text-[14px] text-foreground/55">
					Anota el dinero que tienes hoy para ver tu número.
				</Text>
				<View className="gap-3">
					<SummaryRow
						label="Dinero de hoy"
						testID="confirm-income"
						value={referenceCents == null ? "—" : formatSoles(referenceCents)}
					/>
					<FieldError testID="field-error-openingBalanceCents" message={balanceError} />
					<SummaryRow
						label="Próximo cobro"
						testID="confirm-pay-date"
						value={state.nextPayDate ? formatPayDate(state.nextPayDate) : "—"}
					/>
					<FieldError testID="field-error-nextPayDate" message={payDateError} />
					{envelopes.map((envelope) => {
						const amount = envelopeAmount(envelope.pct);
						return (
							<SummaryRow
								key={envelope.key}
								label={envelope.label}
								testID={`confirm-envelope-${envelope.key}`}
								value={
									amount == null ? `${envelope.pct}%` : `${envelope.pct}% · ${formatSoles(amount)}`
								}
							/>
						);
					})}
					<SummaryRow
						label="Compromisos"
						testID="confirm-commitments"
						value={formatSoles(commitmentsTotalCents)}
					/>
				</View>

				{error ? (
					<Text testID="confirm-error" className="font-hanken text-[13px] text-danger">
						{error}
					</Text>
				) : null}
				{commitmentsFailed ? (
					<Text className="font-hanken text-[13px] text-foreground/55">{COMMITMENTS_NOTE}</Text>
				) : null}
			</View>
		</WizardShell>
	);
}
