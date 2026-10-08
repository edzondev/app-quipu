import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const { pushMock, trackMock } = vi.hoisted(() => ({
	pushMock: vi.fn(),
	trackMock: vi.fn(),
}));

vi.mock("convex/react", () => ({
	useQuery: vi.fn(),
	useMutation: vi.fn(),
}));

vi.mock("next/navigation", () => ({
	useRouter: () => ({ push: pushMock }),
}));

vi.mock("@/core/analytics", () => ({
	AnalyticsEvents: {
		ALLOCATION_CORRECT_STARTED: "allocation_correct_started",
		ALLOCATION_CORRECT_COMPLETED: "allocation_correct_completed",
	},
	track: trackMock,
}));

import { useMutation, useQuery } from "convex/react";
import { getFunctionName } from "convex/server";
import type { Mock } from "vitest";
import { CycleCorrectWizard } from "../cycle-correct-wizard";

const mockedUseQuery = useQuery as unknown as Mock;
const mockedUseMutation = useMutation as unknown as Mock;

const isCreateCommitment = (mutation: unknown) =>
	getFunctionName(mutation as never) === "fixedCommitments:createFixedCommitment";

const SETTINGS_FIXTURE = {
	allocations: { needs: 50, wants: 30, savings: 20 },
};

const SUMMARY_FIXTURE = {
	profile: { currencyCode: "PEN" },
	cycle: {
		id: "cycle1",
		unallocatedCents: 0,
		needsReview: false,
	},
	envelopes: [
		{ type: "needs", allocatedAmount: 380_000, remainingAmount: 380_000 },
		{ type: "wants", allocatedAmount: 0, remainingAmount: 0 },
		{ type: "savings", allocatedAmount: 0, remainingAmount: 0 },
	],
	commitments: [{ id: "c1", name: "Cuota auto", amount: 250_000 }],
};

function mockBackend(overrides?: {
	cycle?: typeof SUMMARY_FIXTURE.cycle | null;
	registeredIncome?: number;
}) {
	mockedUseQuery.mockImplementation((query: unknown) => {
		const name = getFunctionName(query as never);
		if (name === "settings:getSettingsOverview") {
			return SETTINGS_FIXTURE;
		}
		if (name === "cycleCorrection:getRegisteredCycleIncome") {
			return overrides?.registeredIncome ?? 380_000;
		}
		return {
			...SUMMARY_FIXTURE,
			cycle: overrides && "cycle" in overrides ? overrides.cycle : SUMMARY_FIXTURE.cycle,
		};
	});
	mockedUseMutation.mockReturnValue(vi.fn().mockResolvedValue(null));
}

async function goToStep3(options?: {
	correct?: ReturnType<typeof vi.fn>;
	createCommitment?: ReturnType<typeof vi.fn>;
}) {
	const correct = options?.correct ?? vi.fn().mockResolvedValue(null);
	const createCommitment = options?.createCommitment ?? vi.fn().mockResolvedValue("c-new");
	mockedUseMutation.mockImplementation((mutation: unknown) =>
		isCreateCommitment(mutation) ? createCommitment : correct,
	);
	render(<CycleCorrectWizard />);
	fireEvent.change(screen.getByLabelText("Monto que ingresó este ciclo"), {
		target: { value: "3800" },
	});
	fireEvent.click(screen.getByRole("button", { name: /continuar/i }));
	fireEvent.click(screen.getByLabelText("De un compromiso que ya tengo"));
	fireEvent.change(screen.getByLabelText("Monto apartado"), {
		target: { value: "2500" },
	});
	fireEvent.change(screen.getByLabelText("Compromiso"), {
		target: { value: "c1" },
	});
	fireEvent.click(screen.getByRole("button", { name: /continuar/i }));
	await waitFor(() => expect(screen.getByText(/reparte lo libre/i)).toBeTruthy());
	return { correct, createCommitment };
}

beforeEach(() => {
	vi.clearAllMocks();
});

afterEach(cleanup);

describe("CycleCorrectWizard", () => {
	it("paso 1 arranca vacío y avanza al paso 2", () => {
		mockBackend();
		render(<CycleCorrectWizard />);
		const input = screen.getByLabelText("Monto que ingresó este ciclo") as HTMLInputElement;
		expect(input.value).toBe("");
		fireEvent.change(input, { target: { value: "3800" } });
		fireEvent.click(screen.getByRole("button", { name: /continuar/i }));
		expect(screen.getByText(/ya tiene dueño/i)).toBeTruthy();
	});

	it("muestra el estado sin ciclo activo", () => {
		mockBackend({ cycle: null });
		render(<CycleCorrectWizard />);
		expect(screen.getByText(/necesitas un ciclo activo/i)).toBeTruthy();
	});

	it("flujo completo: reserva existente y aplica", async () => {
		mockBackend();
		const { correct, createCommitment } = await goToStep3();
		fireEvent.click(screen.getByRole("button", { name: /aplicar corrección/i }));
		await waitFor(() => expect(correct).toHaveBeenCalledTimes(1));
		const args = correct.mock.calls[0]?.[0];
		expect(args.reserveToCommitments).toEqual([{ commitmentId: "c1", amountCents: 250_000 }]);
		expect(args.setEnvelopeRemaining).toEqual({
			needs: 65_000,
			wants: 39_000,
			savings: 26_000,
		});
		expect(args.setUnallocatedCents).toBe(0);
		expect(args.declaredLiquidCents).toBe(380_000);
		expect(createCommitment).not.toHaveBeenCalled();
		expect(trackMock).toHaveBeenCalledWith(
			"allocation_correct_completed",
			expect.objectContaining({ cycle_id: "cycle1" }),
		);
		await waitFor(() => expect(pushMock).toHaveBeenCalledWith("/dashboard"));
	});

	it("deshabilita aplicar cuando los sobres superan lo libre", async () => {
		mockBackend();
		const { correct } = await goToStep3();
		fireEvent.click(screen.getAllByRole("button", { name: "+" })[0]!);
		const submit = screen.getByRole("button", {
			name: /aplicar corrección/i,
		}) as HTMLButtonElement;
		expect(submit.disabled).toBe(true);
		fireEvent.click(submit);
		expect(correct).not.toHaveBeenCalled();
	});

	it("bloquea aplicar cuando apartado + sobres superan lo disponible real", async () => {
		mockedUseQuery.mockImplementation((query: unknown) => {
			const name = getFunctionName(query as never);
			if (name === "settings:getSettingsOverview") {
				return SETTINGS_FIXTURE;
			}
			if (name === "cycleCorrection:getRegisteredCycleIncome") {
				return 380_000;
			}
			return {
				...SUMMARY_FIXTURE,
				envelopes: [
					{ type: "needs", allocatedAmount: 380_000, remainingAmount: 301_000 },
					{ type: "wants", allocatedAmount: 0, remainingAmount: 0 },
					{ type: "savings", allocatedAmount: 0, remainingAmount: 0 },
				],
			};
		});
		mockedUseMutation.mockReturnValue(vi.fn().mockResolvedValue(null));
		render(<CycleCorrectWizard />);
		fireEvent.change(screen.getByLabelText("Monto que ingresó este ciclo"), {
			target: { value: "3800" },
		});
		fireEvent.click(screen.getByRole("button", { name: /continuar/i }));
		fireEvent.click(screen.getByLabelText("De un compromiso que ya tengo"));
		expect(screen.getByText(/disponible real/i)).toBeTruthy();
		fireEvent.change(screen.getByLabelText("Monto apartado"), {
			target: { value: "2500" },
		});
		fireEvent.change(screen.getByLabelText("Compromiso"), {
			target: { value: "c1" },
		});
		fireEvent.click(screen.getByRole("button", { name: /continuar/i }));
		await waitFor(() => expect(screen.getByText(/reparte lo libre/i)).toBeTruthy());
		expect(screen.getByText(/solo tienes/i)).toBeTruthy();
		expect(screen.getByText(/ajusta los sobres o el monto apartado/i)).toBeTruthy();
		const submit = screen.getByRole("button", {
			name: /aplicar corrección/i,
		}) as HTMLButtonElement;
		expect(submit.disabled).toBe(true);
	});

	it("muestra el error del servidor cuando la corrección falla", async () => {
		mockBackend();
		const correct = vi.fn().mockRejectedValue({
			data: { code: "INSUFFICIENT_FUNDS", message: "Fondos insuficientes" },
		});
		await goToStep3({ correct });
		fireEvent.click(screen.getByRole("button", { name: /aplicar corrección/i }));
		await waitFor(() => expect(screen.getByText(/fondos insuficientes/i)).toBeTruthy());
	});

	it("muestra el error cuando falla la creación del compromiso", async () => {
		mockBackend();
		const correct = vi.fn().mockResolvedValue(null);
		const createCommitment = vi.fn().mockRejectedValue({
			data: {
				code: "VALIDATION_ERROR",
				message: "No se pudo crear el compromiso",
			},
		});
		mockedUseMutation.mockImplementation((mutation: unknown) =>
			isCreateCommitment(mutation) ? createCommitment : correct,
		);
		render(<CycleCorrectWizard />);
		fireEvent.change(screen.getByLabelText("Monto que ingresó este ciclo"), {
			target: { value: "3800" },
		});
		fireEvent.click(screen.getByRole("button", { name: /continuar/i }));
		fireEvent.click(screen.getByLabelText("Crear un compromiso nuevo"));
		fireEvent.change(screen.getByLabelText("Monto apartado"), {
			target: { value: "2500" },
		});
		fireEvent.change(screen.getByLabelText("Nombre"), {
			target: { value: "Cuota auto" },
		});
		fireEvent.change(screen.getByLabelText("Día de pago"), {
			target: { value: "5" },
		});
		fireEvent.click(screen.getByRole("button", { name: /continuar/i }));
		await waitFor(() => expect(screen.getByText(/reparte lo libre/i)).toBeTruthy());
		fireEvent.click(screen.getByRole("button", { name: /aplicar corrección/i }));
		await waitFor(() => expect(screen.getByText(/no se pudo crear el compromiso/i)).toBeTruthy());
		expect(correct).not.toHaveBeenCalled();
	});

	it("bloquea el wizard cuando el ciclo activo no tiene ingreso registrado", () => {
		mockBackend({ registeredIncome: 0 });
		render(<CycleCorrectWizard />);
		expect(screen.getByText(/aún no registras tu ingreso de este ciclo/i)).toBeTruthy();
		expect(screen.queryByLabelText("Monto que ingresó este ciclo")).toBeNull();
		const cta = screen.getByRole("button", { name: /registrar ingreso/i });
		fireEvent.click(cta);
		expect(pushMock).toHaveBeenCalledWith("/income/register");
	});

	it("pide confirmación cuando el ingreso declarado difiere del registrado", () => {
		mockBackend({ registeredIncome: 380_000 });
		render(<CycleCorrectWizard />);
		fireEvent.change(screen.getByLabelText("Monto que ingresó este ciclo"), {
			target: { value: "1200" },
		});
		expect(screen.getByText(/Quipu tiene registrado/)).toBeTruthy();
		expect(screen.getByText(/Declaras/)).toBeTruthy();
		expect(screen.getByText(/como ajuste de conciliación/)).toBeTruthy();
		const next = screen.getByRole("button", {
			name: /continuar/i,
		}) as HTMLButtonElement;
		expect(next.disabled).toBe(true);
		fireEvent.click(screen.getByLabelText(/entiendo; quiero corregir con este monto/i));
		expect(next.disabled).toBe(false);
	});

	it("resetea la confirmación de mismatch al editar el monto", () => {
		mockBackend({ registeredIncome: 380_000 });
		render(<CycleCorrectWizard />);
		const input = screen.getByLabelText("Monto que ingresó este ciclo") as HTMLInputElement;
		fireEvent.change(input, { target: { value: "1200" } });
		fireEvent.click(screen.getByLabelText(/entiendo; quiero corregir con este monto/i));
		const next = screen.getByRole("button", {
			name: /continuar/i,
		}) as HTMLButtonElement;
		expect(next.disabled).toBe(false);
		fireEvent.change(input, { target: { value: "1500" } });
		expect(next.disabled).toBe(true);
	});

	it("no advierte cuando el ingreso declarado coincide con el registrado", () => {
		mockBackend({ registeredIncome: 380_000 });
		render(<CycleCorrectWizard />);
		fireEvent.change(screen.getByLabelText("Monto que ingresó este ciclo"), {
			target: { value: "3800" },
		});
		expect(screen.queryByText(/Quipu tiene registrado/)).toBeNull();
		const next = screen.getByRole("button", {
			name: /continuar/i,
		}) as HTMLButtonElement;
		expect(next.disabled).toBe(false);
	});
});
