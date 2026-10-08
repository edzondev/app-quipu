import { describe, expect, it } from "vitest";
import {
	buildCrisisCoachMessage,
	buildWantsOverflowNudge,
	buildWarningCoachMessage,
	computeUncoveredCommitmentsCents,
	isFullWidthCoachKind,
	resolveCoachPresentation,
	WANTS_OVERFLOW_EVENT,
} from "./coachState";

describe("computeUncoveredCommitmentsCents", () => {
	it("sums amounts for uncovered commitments only", () => {
		expect(
			computeUncoveredCommitmentsCents([
				{ amount: 120_000, coverageStatus: "covered" },
				{ amount: 80_000, coverageStatus: "uncovered" },
				{ amount: 50_000, coverageStatus: "partial" },
			]),
		).toBe(80_000);
	});
});

describe("resolveCoachPresentation", () => {
	const base = {
		pendingCoach: null,
		isEarlyCycle: false,
		compliance: "compliant" as const,
		uncoveredCommitmentsCents: 0,
		profileName: "Ana",
		surplusCents: 24_000,
		currencySymbol: "S/",
	};

	it("returns suggestion when a pending coach interaction exists", () => {
		const result = resolveCoachPresentation({
			...base,
			pendingCoach: {
				id: "coach-1",
				triggerEvent: WANTS_OVERFLOW_EVENT,
				initialNudge: "¿Activamos un rescate preventivo?",
				options: [{ id: "suggest_rescue", label: "Activar rescate" }],
			},
		});

		expect(result?.kind).toBe("suggestion");
		expect(result?.interactionId).toBe("coach-1");
		expect(result?.options).toHaveLength(1);
	});

	it("returns contigo during early cycle without pending coach", () => {
		const result = resolveCoachPresentation({
			...base,
			isEarlyCycle: true,
		});

		expect(result?.kind).toBe("contigo");
		expect(result?.message).toContain("Ana");
	});

	it("returns warning when compliance is warning and no pending coach", () => {
		const result = resolveCoachPresentation({
			...base,
			compliance: "warning",
		});

		expect(result?.kind).toBe("warning");
		expect(result?.message).toBe(buildWarningCoachMessage());
	});

	it("returns crisis when commitments are uncovered", () => {
		const result = resolveCoachPresentation({
			...base,
			uncoveredCommitmentsCents: 18_000,
			crisisOptions: [
				{
					id: "cover_from_savings",
					title: "Tomar del Ahorro del ciclo",
					subtitle: "No toca tu Fondo de emergencia",
					transferTotal: 18_000,
				},
			],
		});

		expect(result?.kind).toBe("crisis");
		expect(result?.message).toBe(buildCrisisCoachMessage(18_000, "S/"));
		expect(result?.crisisOptions).toHaveLength(1);
	});

	it("downgrades crisis to warning when snoozed", () => {
		const result = resolveCoachPresentation({
			...base,
			uncoveredCommitmentsCents: 18_000,
			crisisSnoozed: true,
		});

		expect(result?.kind).toBe("warning");
		expect(result?.message).toBe(buildWarningCoachMessage());
	});

	it("returns crisis when compliance failed even without uncovered commitments", () => {
		const result = resolveCoachPresentation({
			...base,
			compliance: "failed",
		});

		expect(result?.kind).toBe("crisis");
		expect(result?.message).toContain("Resolvámoslo");
	});

	it("returns tranquil when cycle is stable", () => {
		const result = resolveCoachPresentation({
			...base,
		});

		expect(result?.kind).toBe("tranquil");
		expect(result?.message).toContain("Ana");
	});

	it("prefers suggestion over crisis when pending coach exists", () => {
		const result = resolveCoachPresentation({
			...base,
			compliance: "failed",
			uncoveredCommitmentsCents: 50_000,
			pendingCoach: {
				id: "coach-2",
				triggerEvent: WANTS_OVERFLOW_EVENT,
				initialNudge: "¿Congelamos Gustos?",
				options: [{ id: "freeze_wants", label: "Congelar" }],
			},
		});

		expect(result?.kind).toBe("suggestion");
	});
});

describe("buildWantsOverflowNudge", () => {
	it("builds suggest-only copy without emojis", () => {
		const nudge = buildWantsOverflowNudge({
			profileName: "Carlos",
			burnPercent: 62,
			daysElapsed: 4,
		});

		expect(nudge.triggerEvent).toBe(WANTS_OVERFLOW_EVENT);
		expect(nudge.initialNudge).toContain("Carlos");
		expect(nudge.initialNudge).not.toMatch(/[\u{1F300}-\u{1FAFF}]/u);
		expect(nudge.options.every((o) => !/[\u{1F300}-\u{1FAFF}]/u.test(o.label))).toBe(true);
	});
});

describe("isFullWidthCoachKind", () => {
	it("marks warning, suggestion and crisis as full-width", () => {
		expect(isFullWidthCoachKind("warning")).toBe(true);
		expect(isFullWidthCoachKind("suggestion")).toBe(true);
		expect(isFullWidthCoachKind("crisis")).toBe(true);
		expect(isFullWidthCoachKind("tranquil")).toBe(false);
		expect(isFullWidthCoachKind("contigo")).toBe(false);
	});
});
