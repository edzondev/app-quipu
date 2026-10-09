import { useRouter } from "expo-router";
import { useRef, useState } from "react";
import { Pressable, Text, View } from "react-native";
import { WizardShell } from "@/modules/onboarding/components/wizard-shell";
import { useOnboarding } from "@/modules/onboarding/onboarding-provider";
import { useCompleteOnboarding } from "@/modules/onboarding/use-complete-onboarding";
import AuthButton from "@/shared/components/auth/auth-button";
import RegistrarSheet from "@/shared/components/navigation/registrar-sheet";
import { useDashboardSummary } from "@/shared/hooks/use-dashboard";
import { mapDashboardHome } from "@/shared/lib/dashboard/home-model";
import { TODAY_BALANCE_RECORD } from "@/shared/lib/income/draft";
import { validCommitmentsTotalCents } from "@/shared/lib/onboarding/commitments";
import { formatDailyAvailable, formatSoles } from "@/shared/lib/onboarding/daily";

const INCOME_PROMPT = "¿Cuánto dinero tienes hoy?";
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

export function StepConfirm() {
	const router = useRouter();
	const { state } = useOnboarding();
	const { submit, isSubmitting, error, commitmentsFailed } = useCompleteOnboarding();
	const [incomeOpen, setIncomeOpen] = useState(false);
	const [nonce, setNonce] = useState(0);
	const startLock = useRef(false);

	const referenceCents = state.referenceIncomeCents;
	const commitmentsTotalCents = validCommitmentsTotalCents(state.commitments);
	const summary = useDashboardSummary();
	const home = summary ? mapDashboardHome(summary) : null;
	const dailyCents = home ? home.dailyCents : null;

	const envelopeAmount = (pct: number) =>
		referenceCents == null ? null : Math.floor((referenceCents * pct) / 100);

	const envelopes = [
		{ key: "needs", label: "Necesidades", pct: state.allocationNeeds },
		{ key: "wants", label: "Gustos", pct: state.allocationWants },
		{ key: "savings", label: "Ahorro", pct: state.allocationSavings },
	] as const;

	const leave = () => {
		router.replace("/(tabs)");
	};

	const start = async () => {
		if (startLock.current) return;
		startLock.current = true;
		const ok = await submit();
		if (!ok) {
			startLock.current = false;
			return;
		}
		setNonce((current) => current + 1);
		setIncomeOpen(true);
	};

	return (
		<>
			<WizardShell
				stepNumber={4}
				footer={
					<View className="gap-3">
						<AuthButton
							label="Empezar mi ciclo"
							onPress={() => void start()}
							loading={isSubmitting}
							disabled={isSubmitting}
						/>
						{error ? (
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
					<View className="gap-1">
						<Text className="font-newsreader text-[28px] text-foreground">Puedes gastar hoy</Text>
						<Text
							testID="confirm-daily"
							className="font-newsreader text-[52px] leading-[56px] text-foreground"
						>
							{dailyCents == null ? "—" : formatDailyAvailable(dailyCents)}
						</Text>
						<Text className="font-hanken text-[14px] text-foreground/55">
							{home ? home.heroSubtitle : "Anota el dinero que tienes hoy para ver tu número."}
						</Text>
					</View>

					<View className="gap-3">
						<SummaryRow
							label="Dinero de hoy"
							testID="confirm-income"
							value={referenceCents == null ? "—" : formatSoles(referenceCents)}
						/>
						{envelopes.map((envelope) => {
							const amount = envelopeAmount(envelope.pct);
							return (
								<SummaryRow
									key={envelope.key}
									label={envelope.label}
									testID={`confirm-envelope-${envelope.key}`}
									value={
										amount == null
											? `${envelope.pct}%`
											: `${envelope.pct}% · ${formatSoles(amount)}`
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
			<RegistrarSheet
				isPresented={incomeOpen}
				session={{
					nonce,
					intent: "income",
					incomeAmountCents: referenceCents ?? 0,
					incomePrompt: INCOME_PROMPT,
					incomeRecord: TODAY_BALANCE_RECORD,
				}}
				onDismiss={leave}
			/>
		</>
	);
}
