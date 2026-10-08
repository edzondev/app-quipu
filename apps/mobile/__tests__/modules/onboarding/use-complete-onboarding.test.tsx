import { act, render } from "@testing-library/react-native";
import { getFunctionName } from "convex/server";
import { useEffect } from "react";
import { OnboardingProvider, useOnboarding } from "@/modules/onboarding/onboarding-provider";
import { useCompleteOnboarding } from "@/modules/onboarding/use-complete-onboarding";
import { ONBOARDING_DEFAULTS } from "@/shared/lib/onboarding/defaults";
import type { OnboardingState } from "@/shared/lib/onboarding/types";

const mockUseMutation = jest.fn();

jest.mock("convex/react", () => ({
	useMutation: (...args: unknown[]) => mockUseMutation(...args),
}));

const createProfileMock = jest.fn();
const createBulkMock = jest.fn();

function installMutationMocks() {
	mockUseMutation.mockImplementation((mutation: unknown) => {
		const name = getFunctionName(mutation as Parameters<typeof getFunctionName>[0]);
		if (name === "profiles:createProfile") return createProfileMock;
		if (name === "fixedCommitments:createCommitmentsBulk") {
			return createBulkMock;
		}
		throw new Error(`useMutation inesperado en el test: ${name}`);
	});
}

let captured: ReturnType<typeof useCompleteOnboarding> | null = null;
let currentState: OnboardingState | null = null;

function Host({ seed }: { seed: Partial<OnboardingState> }) {
	const { state, dispatch } = useOnboarding();
	currentState = state;
	captured = useCompleteOnboarding();
	useEffect(() => {
		dispatch({ type: "UPDATE", payload: seed });
		dispatch({ type: "SET_STEP", payload: "confirm" });
	}, [dispatch, seed]);
	return null;
}

async function runWithSeed(seed: Partial<OnboardingState>) {
	await act(async () => {
		render(
			<OnboardingProvider>
				<Host seed={seed} />
			</OnboardingProvider>,
		);
	});
}

async function submitInAct() {
	await act(async () => {
		if (captured) await captured.submit();
	});
}

const BASE_SEED: Partial<OnboardingState> = {
	incomeModel: "fixed",
	payFrequency: "monthly",
	referenceIncomeCents: 350000,
	allocationNeeds: 50,
	allocationWants: 30,
	allocationSavings: 20,
};

describe("useCompleteOnboarding", () => {
	beforeEach(() => {
		jest.clearAllMocks();
		installMutationMocks();
		createProfileMock.mockResolvedValue("p1");
		createBulkMock.mockResolvedValue(null);
		captured = null;
		currentState = null;
	});

	it("llama createProfile con el payload correcto (sin referenceIncomeCents) y avanza a success", async () => {
		await runWithSeed(BASE_SEED);
		await submitInAct();
		expect(createProfileMock).toHaveBeenCalledTimes(1);
		const payload = createProfileMock.mock.calls[0][0] as Record<string, unknown>;
		expect(payload).not.toHaveProperty("referenceIncomeCents");
		expect(payload.incomeModel).toBe("fixed");
		expect(payload.payFrequency).toBe("monthly");
		expect(payload.paydays).toEqual([1]);
		expect(payload.allocationNeeds).toBe(50);
		expect(payload.allocationWants).toBe(30);
		expect(payload.allocationSavings).toBe(20);
		expect(currentState?.step).toBe("success");
	});

	it("con compromisos llama createCommitmentsBulk con envelope needs y montos en céntimos", async () => {
		await runWithSeed({
			...BASE_SEED,
			commitments: [
				{ id: "c1", name: "Agua", amountCents: 110000, dueDay: 5 },
				{ id: "c2", name: "Celular", amountCents: 16500, dueDay: 10 },
			],
		});
		await submitInAct();
		expect(createProfileMock).toHaveBeenCalledTimes(1);
		expect(createBulkMock).toHaveBeenCalledTimes(1);
		expect(createBulkMock).toHaveBeenCalledWith({
			profileId: "p1",
			commitments: [
				{ name: "Agua", amount: 110000, envelope: "needs", dueDay: 5 },
				{ name: "Celular", amount: 16500, envelope: "needs", dueDay: 10 },
			],
		});
		expect(currentState?.step).toBe("success");
	});

	it("sin compromisos NO llama createCommitmentsBulk", async () => {
		await runWithSeed(BASE_SEED);
		await submitInAct();
		expect(createBulkMock).not.toHaveBeenCalled();
		expect(currentState?.step).toBe("success");
	});

	it("error de createProfile → error no vacío y no avanza a success", async () => {
		createProfileMock.mockRejectedValue(new Error("Convex error"));
		await runWithSeed(BASE_SEED);
		await submitInAct();
		expect(captured?.error).toBe("Convex error");
		expect(currentState?.step).toBe("confirm");
	});

	it("error de createCommitmentsBulk → error no vacío", async () => {
		createBulkMock.mockRejectedValue(new Error("bulk failed"));
		await runWithSeed({
			...BASE_SEED,
			commitments: [{ id: "c1", name: "Agua", amountCents: 110000, dueDay: 5 }],
		});
		await submitInAct();
		expect(captured?.error).toBe("bulk failed");
		expect(currentState?.step).toBe("confirm");
	});

	it("error no-Error produce mensaje genérico", async () => {
		createProfileMock.mockRejectedValue("boom");
		await runWithSeed(BASE_SEED);
		await submitInAct();
		expect(captured?.error).toBe("No se pudo crear tu sistema. Intenta de nuevo.");
	});

	it("expone defaults intactos: isSubmitting false al inicio", async () => {
		await runWithSeed(BASE_SEED);
		expect(captured?.isSubmitting).toBe(false);
		expect(captured?.error).toBeNull();
		expect(ONBOARDING_DEFAULTS.commitments).toEqual([]);
	});
});
