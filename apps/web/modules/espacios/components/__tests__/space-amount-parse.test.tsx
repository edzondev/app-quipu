import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

const { registerMock, contributeMock } = vi.hoisted(() => ({
	registerMock: vi.fn().mockResolvedValue(undefined),
	contributeMock: vi.fn().mockResolvedValue(undefined),
}));

vi.mock("../../actions", () => ({
	useRegisterSpaceExpense: () => registerMock,
	useContributeToSpace: () => contributeMock,
}));

vi.mock("@/core/analytics", () => ({
	AnalyticsEvents: {
		SPACE_EXPENSE_REGISTERED: "space_expense_registered",
		SPACE_CONTRIBUTION_COMPLETED: "space_contribution_completed",
	},
	track: vi.fn(),
}));

import type { Id } from "@/convex/_generated/dataModel";
import { SpaceContributeFlow } from "../space-contribute-flow";
import { SpaceExpenseFlow } from "../space-expense-flow";

const spaceId = "space_1" as Id<"financialSpaces">;

afterEach(() => {
	cleanup();
	registerMock.mockClear();
	contributeMock.mockClear();
});

describe("space flow amount parse", () => {
	it.each(["10,50", "10.50"] as const)("expense flow sends 1050 cents for %s", async (amount) => {
		render(<SpaceExpenseFlow open onOpenChange={() => undefined} spaceId={spaceId} />);

		fireEvent.change(screen.getByLabelText("Descripción"), {
			target: { value: "Almuerzo" },
		});
		fireEvent.change(screen.getByLabelText("Monto"), {
			target: { value: amount },
		});
		fireEvent.click(screen.getByRole("button", { name: "Registrar" }));

		await waitFor(() => {
			expect(registerMock).toHaveBeenCalledWith(expect.objectContaining({ amount: 1050 }));
		});
	});

	it.each(["10,50", "10.50"] as const)(
		"contribute flow sends 1050 cents for %s",
		async (amount) => {
			render(<SpaceContributeFlow open onOpenChange={() => undefined} spaceId={spaceId} />);

			fireEvent.change(screen.getByLabelText("Monto"), {
				target: { value: amount },
			});
			fireEvent.click(screen.getByRole("button", { name: "Confirmar aporte" }));

			await waitFor(() => {
				expect(contributeMock).toHaveBeenCalledWith(expect.objectContaining({ amountCents: 1050 }));
			});
		},
	);
});
