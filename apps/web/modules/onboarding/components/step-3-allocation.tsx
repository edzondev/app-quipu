"use client";

import { useTransition } from "react";
import { ArrowRight } from "reicon-react/icons/ArrowRight";
import { AnalyticsEvents, track } from "@/core/analytics";
import { Button } from "@/shared/components/ui/button";
import { ENVELOPES } from "@/shared/constants/envelopes";
import { completeOnboardingAction } from "../actions";
import { ALLOCATION_DEFAULTS } from "../lib/allocation";
import { AllocationBar } from "./allocation-bar";
import { AllocationRow } from "./allocation-row";
import { CheckMark } from "./check-mark";
import { useOnboarding } from "./onboarding-provider";
import { OnboardingShell } from "./onboarding-shell";

const ONBOARDING_STARTED_KEY = "qp:onboarding:started_at";

function mapIncomeModelToWorkerType(
	incomeModel: "fixed" | "variable" | "mixed" | undefined,
): "dependent" | "independent" | "mixed" {
	if (incomeModel === "fixed") return "dependent";
	if (incomeModel === "variable") return "independent";
	return "mixed";
}

function readOnboardingDurationSeconds(): number {
	if (typeof window === "undefined") return 0;
	try {
		const raw = window.sessionStorage.getItem(ONBOARDING_STARTED_KEY);
		if (!raw) return 0;
		const startedAt = Number.parseInt(raw, 10);
		if (!Number.isFinite(startedAt)) return 0;
		const seconds = Math.max(0, Math.floor((Date.now() - startedAt) / 1000));
		window.sessionStorage.removeItem(ONBOARDING_STARTED_KEY);
		return seconds;
	} catch {
		return 0;
	}
}

type Props = {
	onBack: VoidFunction;
	onComplete: VoidFunction;
	onStepCompleted: VoidFunction;
};

export function Step3Allocation({ onBack, onComplete, onStepCompleted }: Props) {
	const { state, dispatch } = useOnboarding();
	const [isPending, startTransition] = useTransition();
	const total = state.allocationNeeds + state.allocationWants + state.allocationSavings;
	const isDefault =
		state.allocationNeeds === 50 && state.allocationWants === 30 && state.allocationSavings === 20;

	function reset() {
		dispatch({ type: "UPDATE", payload: ALLOCATION_DEFAULTS });
	}

	function submit() {
		if (total !== 100) return;
		onStepCompleted();
		startTransition(async () => {
			try {
				await completeOnboardingAction(state);
				track(AnalyticsEvents.ONBOARDING_COMPLETED, {
					worker_type: mapIncomeModelToWorkerType(state.incomeModel ?? undefined),
					pay_frequency: state.payFrequency ?? undefined,
					allocation_needs: state.allocationNeeds,
					allocation_wants: state.allocationWants,
					allocation_savings: state.allocationSavings,
					onboarding_duration_seconds: readOnboardingDurationSeconds(),
				});
				onComplete();
			} catch {
				// error handled by fromConvexError
			}
		});
	}

	return (
		<OnboardingShell
			currentStep={3}
			title="¿Cómo repartes lo que entra?"
			subtitle="La regla 50/30/20 es un buen punto de partida. Ajusta si lo necesitas."
			onBack={onBack}
			cta={
				<Button onClick={submit} disabled={total !== 100 || isPending} size="lg" className="gap-2">
					{isPending ? (
						"Creando sistema…"
					) : (
						<>
							Crear mi sistema
							<ArrowRight size={20} color="currentColor" />
						</>
					)}
				</Button>
			}
		>
			<AllocationBar
				needs={state.allocationNeeds}
				wants={state.allocationWants}
				savings={state.allocationSavings}
			/>

			<div className="flex flex-col gap-3">
				{ENVELOPES.map((env) => (
					<AllocationRow
						key={`${env.key}-${state[env.key]}`}
						envKey={env.key}
						label={env.label}
						desc={env.desc}
						barColor={env.barColor}
						value={state[env.key]}
						state={state}
						dispatch={(payload) => dispatch({ type: "UPDATE", payload })}
					/>
				))}
			</div>

			<div className="flex items-center gap-4">
				{total === 100 ? (
					<div className="flex items-center gap-2 text-sm text-primary">
						<span className="flex size-4 items-center justify-center rounded-full bg-primary-soft">
							<CheckMark size={10} strokeWidth={3.5} />
						</span>
						Suma 100% · listo
					</div>
				) : (
					<div className="rounded-lg bg-danger-bg p-3 text-sm text-danger-ink" role="alert">
						El reparto suma {total}%. Ajusta para que sea exactamente 100% antes de continuar.
					</div>
				)}
				{!isDefault && (
					<button
						type="button"
						onClick={reset}
						className="ml-auto text-xs text-muted-foreground underline hover:text-foreground"
					>
						Reiniciar a 50/30/20
					</button>
				)}
			</div>
		</OnboardingShell>
	);
}
