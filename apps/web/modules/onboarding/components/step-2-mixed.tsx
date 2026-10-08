"use client";

import { useState } from "react";
import { ArrowRight } from "reicon-react/icons/ArrowRight";
import { X } from "reicon-react/icons/X";
import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";
import { Label } from "@/shared/components/ui/label";
import { cn } from "@/shared/lib/utils";
import { DAY_PILLS } from "../constants";
import { useOnboarding } from "./onboarding-provider";
import { OnboardingShell } from "./onboarding-shell";

type Props = { onBack: VoidFunction; onNext: VoidFunction };

export function Step2Mixed({ onBack, onNext }: Props) {
	const { state, dispatch } = useOnboarding();
	const mixedDay = state.paydays?.[0] ?? 1;

	function addSource(label: string) {
		dispatch({
			type: "UPDATE",
			payload: {
				variableIncomeSources: [...state.variableIncomeSources, label],
			},
		});
	}

	function removeSource(label: string) {
		dispatch({
			type: "UPDATE",
			payload: {
				variableIncomeSources: state.variableIncomeSources.filter((s) => s !== label),
			},
		});
	}

	return (
		<OnboardingShell
			currentStep={2}
			title="Combinemos lo fijo y lo variable"
			subtitle="Configura tu parte previsible; el resto entra cuando lo registres."
			onBack={onBack}
			cta={
				<Button onClick={onNext} size="lg" className="gap-2">
					Continuar
					<ArrowRight size={20} color="currentColor" />
				</Button>
			}
		>
			<div className="flex flex-col gap-3">
				<div className="rounded-xl border border-border bg-card p-5">
					<div className="mb-3 flex items-center gap-2">
						<span className="size-3 rounded-full bg-needs" />
						<p className="font-semibold">Ingreso previsible</p>
						<span className="text-xs text-muted-foreground">· sueldo, mensualidad</span>
					</div>
					<div className="flex flex-col md:flex-row gap-3">
						<AmountField
							initialCents={state.mixedFixedAmount}
							onCommit={(cents) =>
								dispatch({
									type: "UPDATE",
									payload: { mixedFixedAmount: cents ?? undefined },
								})
							}
						/>
						<div className="flex-1 rounded-lg border border-border bg-surface p-3">
							<p className="text-xs text-muted-foreground">Día de pago</p>
							<div className="mt-1 flex flex-wrap gap-1.5">
								{DAY_PILLS.map((day) => (
									<DayPill
										key={day}
										label={`Día ${day}`}
										selected={mixedDay === day}
										onClick={() =>
											dispatch({
												type: "UPDATE",
												payload: { paydays: [day], payFrequency: "monthly" },
											})
										}
									/>
								))}
							</div>
						</div>
					</div>
				</div>

				<div className="rounded-xl border border-border bg-card p-5">
					<div className="mb-3 flex items-center gap-2">
						<span className="size-3 rounded-full bg-clay" />
						<p className="font-semibold">Ingresos variables</p>
						<span className="text-xs text-muted-foreground">· tipos que esperás recibir</span>
					</div>
					<VariableSourceInput
						sources={state.variableIncomeSources}
						onAdd={addSource}
						onRemove={removeSource}
					/>
				</div>
			</div>
		</OnboardingShell>
	);
}

function AmountField({
	initialCents,
	onCommit,
}: {
	initialCents: number | undefined;
	onCommit: (cents: number | null) => void;
}) {
	const [draft, setDraft] = useState(initialCents != null ? (initialCents / 100).toString() : "");

	function commit() {
		const num = Number.parseFloat(draft);
		if (Number.isNaN(num) || num === 0) {
			onCommit(null);
			return;
		}
		onCommit(Math.round(num * 100));
	}

	return (
		<div className="flex-1 rounded-lg border border-border bg-surface p-3">
			<Label className="text-xs text-muted-foreground" htmlFor="income">
				¿Cuánto recibes normalmente cada mes?
			</Label>
			<div className="relative mt-1">
				<span className="absolute left-0 top-1/2 -translate-y-1/2 font-serif text-xl text-muted-foreground">
					S/
				</span>
				<Input
					id="income"
					type="text"
					inputMode="decimal"
					value={draft}
					onChange={(e) => setDraft(e.target.value)}
					onBlur={commit}
					onKeyDown={(e) => {
						if (e.key === "Enter") (e.target as HTMLInputElement).blur();
					}}
					placeholder="—"
					className="border-none bg-transparent p-0 pl-7 font-serif text-xl text-foreground placeholder:text-muted-foreground focus-visible:ring-0"
				/>
			</div>
			<p className="mt-0.5 text-[10px] text-muted-foreground">
				Es una estimación. Podrás cambiarla después.
			</p>
		</div>
	);
}

function DayPill({
	label,
	selected,
	onClick,
}: {
	label: string;
	selected: boolean;
	onClick: VoidFunction;
}) {
	return (
		<button
			type="button"
			onClick={onClick}
			className={cn(
				"rounded-lg border px-3 py-1.5 text-sm",
				selected
					? "border-primary bg-primary-soft font-semibold text-primary"
					: "border-border text-muted-foreground hover:border-primary/50",
			)}
		>
			{label}
		</button>
	);
}

function VariableSourceInput({
	sources,
	onAdd,
	onRemove,
}: {
	sources: string[];
	onAdd: (label: string) => void;
	onRemove: (label: string) => void;
}) {
	const [draft, setDraft] = useState("");

	function commit() {
		const trimmed = draft.trim();
		if (!trimmed || sources.includes(trimmed)) {
			setDraft("");
			return;
		}
		onAdd(trimmed);
		setDraft("");
	}

	return (
		<div className="flex flex-1 w-full flex-wrap gap-2">
			<Label htmlFor="variable-income" className="w-full text-xs text-muted-foreground">
				Agregar fuente de ingreso variable
			</Label>
			{sources.map((tag) => (
				<SourcePill key={tag} label={tag} onRemove={() => onRemove(tag)} />
			))}
			<input
				id="variable-income"
				type="text"
				value={draft}
				onChange={(e) => setDraft(e.target.value)}
				onBlur={commit}
				onKeyDown={(e) => {
					if (e.key === "Enter") {
						e.preventDefault();
						commit();
					}
				}}
				placeholder="+ Agregar"
				maxLength={30}
				className="rounded-full border border-dashed border-border bg-surface-soft px-3 py-1.5 text-sm text-foreground outline-none placeholder:text-muted-foreground focus:border-primary"
			/>
		</div>
	);
}

function SourcePill({ label, onRemove }: { label: string; onRemove: VoidFunction }) {
	return (
		<span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-card px-3 py-1.5 text-sm text-muted-foreground">
			{label}
			<button
				type="button"
				onClick={onRemove}
				className="text-muted-foreground hover:text-foreground"
				aria-label={`Quitar ${label}`}
			>
				<X size={12} />
			</button>
		</span>
	);
}
