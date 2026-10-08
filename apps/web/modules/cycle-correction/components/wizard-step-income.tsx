"use client";

import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";
import { formatCents, parseToCents } from "@/shared/lib/money";

type Props = {
	amountText: string;
	currencyCode: string;
	onAmountChange: (value: string) => void;
	onNext: () => void;
	registeredIncomeCents?: number;
	mismatch?: boolean;
	mismatchConfirmed?: boolean;
	onMismatchConfirmedChange?: (checked: boolean) => void;
};

export function WizardStepIncome({
	amountText,
	currencyCode,
	onAmountChange,
	onNext,
	registeredIncomeCents,
	mismatch,
	mismatchConfirmed,
	onMismatchConfirmedChange,
}: Props) {
	const cents = parseToCents(amountText);
	const valid = cents != null && cents > 0;
	const diff = (cents ?? 0) - (registeredIncomeCents ?? 0);
	const blocked = mismatch === true && mismatchConfirmed !== true;
	return (
		<div className="space-y-4">
			<div>
				<h2 className="font-serif text-xl text-ink">¿Cuánto dinero entró realmente este ciclo?</h2>
				<p className="mt-1 text-sm text-mute">El monto total que recibiste, sin restar nada.</p>
			</div>
			<Input
				aria-label="Monto que ingresó este ciclo"
				className="h-14 text-center font-serif text-2xl"
				inputMode="decimal"
				placeholder="0.00"
				value={amountText}
				onChange={(event) => onAmountChange(event.target.value)}
			/>
			{mismatch ? (
				<div className="rounded-[14px] border border-line bg-card p-3 text-[12px] text-warning-text">
					<p>{`Quipu tiene registrado ${formatCents(registeredIncomeCents ?? 0, { currency: currencyCode })} · Declaras ${formatCents(cents ?? 0, { currency: currencyCode })}`}</p>
					<p className="mt-1">{`La diferencia (${diff >= 0 ? "+" : "−"}${formatCents(Math.abs(diff), { currency: currencyCode })}) ${diff >= 0 ? "entrará" : "saldrá"} como ajuste de conciliación.`}</p>
					<label className="mt-2 flex items-center gap-2">
						<input
							type="checkbox"
							className="accent-[var(--qp)]"
							checked={mismatchConfirmed === true}
							onChange={(event) => onMismatchConfirmedChange?.(event.target.checked)}
						/>
						Entiendo; quiero corregir con este monto
					</label>
				</div>
			) : null}
			<p className="text-[12px] text-mute">Moneda: {currencyCode}</p>
			<Button className="w-full" disabled={!valid || blocked} onClick={onNext}>
				Continuar
			</Button>
		</div>
	);
}
