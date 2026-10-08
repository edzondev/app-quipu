"use client";

import { ArrowRight } from "reicon-react/icons/ArrowRight";
import { Button } from "@/shared/components/ui/button";
import { cn } from "@/shared/lib/utils";
import { CheckMark } from "./check-mark";
import { useOnboarding } from "./onboarding-provider";
import { OnboardingShell } from "./onboarding-shell";

type Props = { onBack: VoidFunction; onNext: VoidFunction };

export function Step2Variable({ onBack, onNext }: Props) {
	const { state, dispatch } = useOnboarding();
	const canContinue = state.cycleDurationDays != null;

	return (
		<OnboardingShell
			currentStep={2}
			title="¿Cómo prefieres tus ciclos?"
			subtitle="Como tus ingresos varían, Quipu trabaja por ciclos fijos y reparte lo que va entrando."
			onBack={onBack}
			cta={
				<Button onClick={onNext} disabled={!canContinue} size="lg" className="gap-2">
					Continuar
					<ArrowRight size={20} color="currentColor" />
				</Button>
			}
		>
			<div className="flex gap-3">
				{([15, 30] as const).map((days) => {
					const selected = state.cycleDurationDays === days;
					return (
						<button
							key={days}
							type="button"
							aria-pressed={selected}
							onClick={() =>
								dispatch({
									type: "UPDATE",
									payload: { cycleDurationDays: days },
								})
							}
							className={cn(
								"flex flex-1 flex-col rounded-xl border-2 p-5 text-left",
								selected
									? "border-primary bg-primary-soft"
									: "border-border bg-card hover:border-primary/50",
							)}
						>
							<p className="font-serif text-2xl text-foreground">{days} días</p>
							<p className="mt-2 text-sm text-muted-foreground">
								{days === 15
									? "Ciclos cortos, ideal si cobras seguido."
									: "Un mes completo para ver el panorama."}
							</p>
							<span
								className={cn(
									"mt-3 flex size-5 items-center justify-center rounded-full self-start",
									selected ? "bg-primary" : "border-2 border-border",
								)}
							>
								{selected && <CheckMark size={12} />}
							</span>
						</button>
					);
				})}
			</div>
			<div className="flex items-start gap-3 rounded-xl border border-border bg-surface-soft p-4 text-sm text-muted-foreground">
				<span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-primary-soft text-xs font-bold text-primary">
					i
				</span>
				<p>
					Cada ingreso que registres se reparte en tus sobres según tu porcentaje. Si un ciclo entra
					poco, Quipu te avisa con calma.
				</p>
			</div>
		</OnboardingShell>
	);
}
