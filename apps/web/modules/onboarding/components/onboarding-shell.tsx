"use client";

import type { ReactNode } from "react";
import { ArrowLeft } from "reicon-react/icons/ArrowLeft";
import { cn } from "@/shared/lib/utils";
import { STEP_LABELS } from "../constants";
import { CheckMark } from "./check-mark";

type Props = {
	currentStep: number;
	title: string;
	subtitle?: string;
	children: ReactNode;
	onBack?: VoidFunction;
	cta?: ReactNode;
	hint?: string;
};

export function OnboardingShell({
	currentStep,
	title,
	subtitle,
	children,
	onBack,
	cta,
	hint,
}: Props) {
	return (
		<div className="mx-auto flex w-full max-w-4xl flex-col gap-8 px-4 py-10">
			<div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
				<QuipuLogo />
				<Stepper currentStep={currentStep} />
			</div>

			<div className="flex flex-col">
				<span className="font-mono text-[11px] uppercase tracking-[0.12em] text-clay">
					Paso {currentStep} de {STEP_LABELS.length}
				</span>
				<h1 className="mt-2.5 font-serif text-[33px] font-medium leading-tight text-foreground">
					{title}
				</h1>
				{subtitle && <p className="mt-1.5 text-[15px] text-muted-foreground">{subtitle}</p>}
			</div>

			{children}

			<div className="mt-2 flex items-center justify-between">
				{onBack ? (
					<button
						type="button"
						onClick={onBack}
						className="inline-flex items-center gap-1 text-[13px] font-medium text-muted-foreground hover:text-foreground"
					>
						<ArrowLeft size={16} color="currentColor" aria-hidden />
						Atrás
					</button>
				) : hint ? (
					<span className="text-[13px] text-faint">{hint}</span>
				) : (
					<div />
				)}
				{cta && <div>{cta}</div>}
			</div>
		</div>
	);
}

function QuipuLogo() {
	return (
		<div className="flex items-center gap-2">
			<span className="flex flex-col gap-[2.5px]">
				<span className="h-[2.5px] w-4 rounded-[2px] bg-primary" />
				<span className="h-[2.5px] w-2.75 rounded-[2px] bg-moss" />
				<span className="h-[2.5px] w-1.5 rounded-[2px] bg-clay" />
			</span>
			<span className="font-serif text-[18px] font-medium text-foreground">Quipu</span>
		</div>
	);
}

function Stepper({ currentStep }: { currentStep: number }) {
	return (
		<div className="flex items-center gap-2.5">
			{STEP_LABELS.map((label, i) => {
				const step = i + 1;
				const isActive = step === currentStep;
				const isComplete = step < currentStep;
				return (
					<div key={label} className="flex items-center gap-2.5">
						<div className="flex items-center gap-2">
							<span
								className={cn(
									"flex size-5.5 items-center justify-center rounded-full text-[11px] font-bold",
									isComplete || isActive
										? "bg-primary text-primary-foreground"
										: "border border-border text-muted-foreground",
								)}
							>
								{isComplete ? <CheckMark size={10} /> : step}
							</span>
							<span
								className={cn(
									"text-[12.5px] font-semibold",
									isActive ? "text-foreground" : "text-muted-foreground",
								)}
							>
								{label}
							</span>
						</div>
						{i < STEP_LABELS.length - 1 && <span className="h-px w-5.5 bg-border" />}
					</div>
				);
			})}
		</div>
	);
}
