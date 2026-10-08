import {
	buildEarlyCycleCoachMessage,
	buildTranquilCoachMessage,
	type CycleCompliance,
} from "./dashboardMath";

export const WANTS_OVERFLOW_EVENT = "WANTS_OVERFLOW_60";

export type CoachKind = "tranquil" | "warning" | "suggestion" | "crisis" | "contigo";

export type CommitmentCoverageStatus = "covered" | "partial" | "uncovered";

export type PendingCoachSlice = {
	id: string;
	triggerEvent: string;
	initialNudge: string;
	options: Array<{ id: string; label: string }>;
};

export type ResolveCoachInput = {
	pendingCoach: PendingCoachSlice | null;
	isEarlyCycle: boolean;
	compliance: CycleCompliance;
	uncoveredCommitmentsCents: number;
	profileName: string;
	surplusCents: number;
	currencySymbol?: string;
	crisisSnoozed?: boolean;
	crisisOptions?: CrisisCoachOptionSlice[];
};

export type CoachPresentation = {
	kind: CoachKind;
	message: string;
	interactionId?: string;
	options?: Array<{ id: string; label: string }>;
	crisisOptions?: Array<{
		id: string;
		title: string;
		subtitle: string;
		commitmentId?: string;
		transferTotal?: number;
	}>;
};

export type CrisisCoachOptionSlice = NonNullable<CoachPresentation["crisisOptions"]>[number];

export function computeUncoveredCommitmentsCents(
	commitments: Array<{
		amount: number;
		coverageStatus: CommitmentCoverageStatus;
	}>,
): number {
	return commitments
		.filter((commitment) => commitment.coverageStatus === "uncovered")
		.reduce((acc, commitment) => acc + commitment.amount, 0);
}

export function buildWarningCoachMessage(): string {
	return "Tu ritmo de gastos es más alto de lo habitual. Todavía puedes ajustar.";
}

export function buildCrisisCoachMessage(deficitCents: number, currencySymbol = "S/"): string {
	const amount = (deficitCents / 100).toLocaleString("es-PE", {
		minimumFractionDigits: 2,
		maximumFractionDigits: 2,
	});
	return `Te faltan ${currencySymbol} ${amount} para cubrir tus compromisos. Resolvámoslo ahora en un paso.`;
}

export function buildEnvelopeCrisisMessage(): string {
	return "Hay presión en tus sobres. Resolvámoslo ahora en un paso.";
}

export function buildWantsOverflowNudge(params: {
	profileName: string;
	burnPercent: number;
	daysElapsed: number;
}): {
	triggerEvent: typeof WANTS_OVERFLOW_EVENT;
	initialNudge: string;
	options: Array<{ id: string; label: string }>;
} {
	const { profileName, burnPercent, daysElapsed } = params;
	return {
		triggerEvent: WANTS_OVERFLOW_EVENT,
		initialNudge: `${profileName}, ya usaste el ${burnPercent.toFixed(0)}% de tu sobre de Gustos en ${daysElapsed.toFixed(0)} días. ¿Congelamos Gustos tres días o activamos un rescate preventivo?`,
		options: [
			{ id: "freeze_wants", label: "Congelar Gustos 3 días" },
			{ id: "suggest_rescue", label: "Activar rescate preventivo" },
			{ id: "ignore", label: "Ahora no" },
		],
	};
}

export function isFullWidthCoachKind(kind: CoachKind): boolean {
	return kind === "warning" || kind === "suggestion" || kind === "crisis";
}

export function resolveCoachPresentation(input: ResolveCoachInput): CoachPresentation {
	const {
		pendingCoach,
		isEarlyCycle,
		compliance,
		uncoveredCommitmentsCents,
		profileName,
		surplusCents,
		currencySymbol = "S/",
		crisisSnoozed = false,
		crisisOptions = [],
	} = input;

	const buildCrisisPresentation = (): CoachPresentation => ({
		kind: "crisis",
		message:
			uncoveredCommitmentsCents > 0
				? buildCrisisCoachMessage(uncoveredCommitmentsCents, currencySymbol)
				: buildEnvelopeCrisisMessage(),
		crisisOptions,
	});

	if (pendingCoach) {
		return {
			kind: "suggestion",
			message: pendingCoach.initialNudge,
			interactionId: pendingCoach.id,
			options: pendingCoach.options,
		};
	}

	if (isEarlyCycle) {
		return {
			kind: "contigo",
			message: buildEarlyCycleCoachMessage(profileName),
		};
	}

	if (compliance === "failed") {
		if (crisisSnoozed) {
			return {
				kind: "warning",
				message: buildWarningCoachMessage(),
			};
		}
		return buildCrisisPresentation();
	}

	if (uncoveredCommitmentsCents > 0) {
		if (crisisSnoozed) {
			return {
				kind: "warning",
				message: buildWarningCoachMessage(),
			};
		}
		return buildCrisisPresentation();
	}

	if (compliance === "warning") {
		return {
			kind: "warning",
			message: buildWarningCoachMessage(),
		};
	}

	return {
		kind: "tranquil",
		message: buildTranquilCoachMessage(profileName, surplusCents, currencySymbol),
	};
}
