import { onboardingReducer } from "@/modules/onboarding/state";
import { ONBOARDING_DEFAULTS } from "@/shared/lib/onboarding/defaults";
import type { DraftCommitment, OnboardingState } from "@/shared/lib/onboarding/types";

const commitment: DraftCommitment = {
	id: "c1",
	name: "Renta",
	amountCents: 90000,
	dueDay: 5,
};

const baseState: OnboardingState = {
	...ONBOARDING_DEFAULTS,
	step: 2,
	incomeModel: "fixed",
	referenceIncomeCents: 350000,
};

describe("onboardingReducer", () => {
	it("UPDATE mergea el payload sobre el estado", () => {
		const next = onboardingReducer(baseState, {
			type: "UPDATE",
			payload: { payFrequency: "monthly" },
		});
		expect(next.payFrequency).toBe("monthly");
		expect(next.incomeModel).toBe("fixed");
		expect(next.step).toBe(2);
	});

	it("SET_STEP cambia el paso", () => {
		const next = onboardingReducer(baseState, {
			type: "SET_STEP",
			payload: "confirm",
		});
		expect(next.step).toBe("confirm");
		expect(next.incomeModel).toBe("fixed");
	});

	it("ADD_COMMITMENT agrega por id", () => {
		const next = onboardingReducer(baseState, {
			type: "ADD_COMMITMENT",
			payload: commitment,
		});
		expect(next.commitments).toHaveLength(1);
		expect(next.commitments[0]).toEqual(commitment);
	});

	it("REMOVE_COMMITMENT elimina por id", () => {
		const withC = onboardingReducer(baseState, {
			type: "ADD_COMMITMENT",
			payload: commitment,
		});
		const next = onboardingReducer(withC, {
			type: "REMOVE_COMMITMENT",
			payload: "c1",
		});
		expect(next.commitments).toHaveLength(0);
	});

	it("REMOVE_COMMITMENT ignora ids inexistentes", () => {
		const next = onboardingReducer(baseState, {
			type: "REMOVE_COMMITMENT",
			payload: "nope",
		});
		expect(next.commitments).toHaveLength(0);
	});

	it("UPDATE_COMMITMENT reemplaza el compromiso con el mismo id", () => {
		const withC = onboardingReducer(baseState, {
			type: "ADD_COMMITMENT",
			payload: commitment,
		});
		const updated: DraftCommitment = { ...commitment, amountCents: 95000 };
		const next = onboardingReducer(withC, {
			type: "UPDATE_COMMITMENT",
			payload: updated,
		});
		expect(next.commitments).toHaveLength(1);
		expect(next.commitments[0].amountCents).toBe(95000);
	});

	it("UPDATE_COMMITMENT no toca otros compromisos", () => {
		const c2: DraftCommitment = {
			id: "c2",
			name: "Luz",
			amountCents: 10000,
			dueDay: 10,
		};
		let s = onboardingReducer(baseState, {
			type: "ADD_COMMITMENT",
			payload: commitment,
		});
		s = onboardingReducer(s, { type: "ADD_COMMITMENT", payload: c2 });
		const next = onboardingReducer(s, {
			type: "UPDATE_COMMITMENT",
			payload: { ...c2, amountCents: 12000 },
		});
		expect(next.commitments).toHaveLength(2);
		expect(next.commitments.find((c) => c.id === "c1")).toEqual(commitment);
		expect(next.commitments.find((c) => c.id === "c2")?.amountCents).toBe(12000);
	});

	it("RESET vuelve a los defaults", () => {
		const next = onboardingReducer(baseState, { type: "RESET" });
		expect(next).toEqual(ONBOARDING_DEFAULTS);
		expect(next).not.toBe(baseState);
	});
});
