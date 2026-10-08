import type { Doc } from "@/convex/_generated/dataModel";
import { FREQ_DISPLAY_LABELS, MODEL_DISPLAY_LABELS } from "@/modules/onboarding/constants";

type ProfileSlice = Pick<
	Doc<"profiles">,
	"incomeModel" | "payFrequency" | "paydays" | "cycleDurationDays"
>;

export function formatCycleType(profile: ProfileSlice): string {
	if (profile.incomeModel === "variable") {
		const days = profile.cycleDurationDays ?? 30;
		return `Ciclos de ${days} días`;
	}
	if (profile.payFrequency === "biweekly") {
		return "Ciclos quincenales";
	}
	if (profile.payFrequency === "weekly") {
		return "Ciclos semanales";
	}
	return "Ciclos de 30 días";
}

export function formatCycleStart(profile: ProfileSlice): string {
	const paydays = profile.paydays ?? [];
	if (profile.incomeModel === "variable") {
		return "Al registrar tu primer ingreso";
	}
	if (paydays.length === 0) {
		return "Sin día configurado";
	}
	if (paydays.length === 1) {
		return `Día ${paydays[0]} de cada mes`;
	}
	const sorted = [...paydays].sort((a, b) => a - b);
	return `Días ${sorted.join(" y ")} de cada mes`;
}

export function formatIncomeProfileLabel(profile: ProfileSlice): string {
	const model = MODEL_DISPLAY_LABELS[profile.incomeModel] ?? profile.incomeModel;
	if (profile.incomeModel === "fixed" && profile.payFrequency) {
		const freq = FREQ_DISPLAY_LABELS[profile.payFrequency] ?? profile.payFrequency;
		return `${model} · ${freq}`;
	}
	return model;
}
