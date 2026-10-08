"use client";

import { Button } from "@/shared/components/ui/button";
import { Label } from "@/shared/components/ui/label";
import { ENVELOPE_LABELS } from "@/shared/constants/envelopes";
import { formatCents } from "@/shared/lib/money";
import type { EnvelopeTargets } from "../lib/simple-correction-plan";

type Props = {
	freeCents: number;
	targets: EnvelopeTargets;
	currencyCode: string;
	spentCents: number;
	onTargetChange: (key: keyof EnvelopeTargets, cents: number) => void;
	onResetProposal: () => void;
	onBack: () => void;
	onSubmit: () => void;
	disabled?: boolean;
};

const STEP_CENTS = 10_000;

export function WizardStepSplit(props: Props) {
	const assigned = props.targets.needs + props.targets.wants + props.targets.savings;
	return (
		<div className="space-y-4">
			<div>
				<h2 className="font-serif text-xl text-ink">Reparte lo libre</h2>
				<p className="mt-1 text-sm text-mute">
					Tus sobres quedarán con{" "}
					<span className="font-medium text-ink">
						{formatCents(assigned, { currency: props.currencyCode })}
					</span>{" "}
					en total.
				</p>
				<p className="mt-1 text-sm text-mute">
					Ya gastaste{" "}
					<span className="font-medium text-ink">
						{formatCents(props.spentCents, { currency: props.currencyCode })}
					</span>{" "}
					este ciclo; ese dinero sale en la corrección.
				</p>
			</div>
			<div className="space-y-3">
				{(["needs", "wants", "savings"] as const).map((key) => (
					<div
						key={key}
						className="flex items-center justify-between rounded-[14px] border border-line bg-card p-3"
					>
						<Label className="text-[13px]">{ENVELOPE_LABELS[key]}</Label>
						<div className="flex items-center gap-2">
							<Button
								type="button"
								variant="outline"
								className="h-8 w-8 p-0"
								aria-label="−"
								onClick={() =>
									props.onTargetChange(key, Math.max(0, props.targets[key] - STEP_CENTS))
								}
							>
								−
							</Button>
							<span className="w-24 text-center text-sm font-medium tabular-nums">
								{formatCents(props.targets[key], {
									currency: props.currencyCode,
								})}
							</span>
							<Button
								type="button"
								variant="outline"
								className="h-8 w-8 p-0"
								aria-label="+"
								onClick={() => props.onTargetChange(key, props.targets[key] + STEP_CENTS)}
							>
								+
							</Button>
						</div>
					</div>
				))}
			</div>
			<div className="flex gap-2">
				<Button type="button" variant="outline" className="flex-1" onClick={props.onResetProposal}>
					50/30/20
				</Button>
			</div>
			<div className="flex gap-2 pt-2">
				<Button variant="outline" className="flex-1" onClick={props.onBack}>
					Atrás
				</Button>
				<Button className="flex-1" disabled={props.disabled === true} onClick={props.onSubmit}>
					Aplicar corrección
				</Button>
			</div>
		</div>
	);
}
