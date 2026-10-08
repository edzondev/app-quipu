/**
 * Regresión: cerrar tras un update deja el sheet en detalle (reset en el
 * handler de cierre), sin remount por key — así Base UI anima la entrada.
 * AnimatedView envuelve el cuerpo; los tests no dependen de clases de animación.
 */

import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { MovementForDetail } from "../movement-detail-sheet";

vi.mock("convex/react", () => ({
	useMutation: () => vi.fn().mockResolvedValue(undefined),
}));

vi.mock("@/core/analytics", () => ({
	AnalyticsEvents: {
		MOVEMENT_DELETED: "movement_deleted",
		ALLOCATION_CORRECT_CTA_CLICKED: "allocation_correct_cta_clicked",
		INCOME_EVENT_UPDATED: "income_event_updated",
	},
	track: vi.fn(),
}));

vi.mock("@/shared/hooks/use-mobile", () => ({
	useIsMobile: () => false,
}));

vi.mock("../expense-edit-form", () => ({
	ExpenseEditForm: ({ onSuccess, autoFocus }: { onSuccess: () => void; autoFocus?: boolean }) => (
		<div>
			{autoFocus ? <button type="button">Teclado 1</button> : null}
			<button type="button" onClick={onSuccess}>
				Guardar gasto
			</button>
		</div>
	),
}));

vi.mock("../income-edit-form", () => ({
	IncomeEditForm: ({ onSuccess, autoFocus }: { onSuccess: () => void; autoFocus?: boolean }) => (
		<div>
			{autoFocus ? <input type="text" inputMode="decimal" aria-label="Monto" /> : null}
			<button type="button" onClick={onSuccess}>
				Guardar ingreso
			</button>
		</div>
	),
}));

const { MovementDetailSheet } = await import("../movement-detail-sheet");

const expenseA: MovementForDetail = {
	id: "expense-a",
	kind: "expense",
	label: "Café",
	amount: 500,
	timestamp: 1_700_000_000_000,
	envelopeType: "wants",
};

const expenseB: MovementForDetail = {
	id: "expense-b",
	kind: "expense",
	label: "Almuerzo",
	amount: 1500,
	timestamp: 1_700_000_100_000,
	envelopeType: "needs",
};

const incomeA: MovementForDetail = {
	id: "income-a",
	kind: "income",
	label: "Sueldo",
	amount: 250_000,
	timestamp: 1_700_000_200_000,
	occurredAt: 1_700_000_200_000,
	source: "payroll",
};

const incomeMissingFields: MovementForDetail = {
	id: "income-b",
	kind: "income",
	label: "Sueldo incompleto",
	amount: 250_000,
	timestamp: 1_700_000_300_000,
};

afterEach(() => {
	cleanup();
});

describe("MovementDetailSheet", () => {
	it("al reabrir el mismo movimiento tras success muestra el detalle", () => {
		const { rerender } = render(
			<MovementDetailSheet
				open
				onOpenChange={(next) => {
					rerender(
						<MovementDetailSheet open={next} onOpenChange={() => undefined} movement={expenseA} />,
					);
				}}
				movement={expenseA}
			/>,
		);

		fireEvent.click(screen.getByRole("button", { name: "Editar" }));
		fireEvent.click(screen.getByRole("button", { name: "Guardar gasto" }));
		expect(screen.getByText("Listo")).toBeTruthy();

		fireEvent.click(screen.getByRole("button", { name: "Cerrar" }));

		rerender(<MovementDetailSheet open onOpenChange={() => undefined} movement={expenseA} />);

		expect(screen.getByRole("heading", { name: "Detalle del movimiento" })).toBeTruthy();
		expect(screen.queryByText("Listo")).toBeNull();
	});

	it("tras cerrar success, abrir otro movimiento muestra su detalle", () => {
		const { rerender } = render(
			<MovementDetailSheet
				open
				onOpenChange={(next) => {
					rerender(
						<MovementDetailSheet open={next} onOpenChange={() => undefined} movement={expenseA} />,
					);
				}}
				movement={expenseA}
			/>,
		);

		fireEvent.click(screen.getByRole("button", { name: "Editar" }));
		fireEvent.click(screen.getByRole("button", { name: "Guardar gasto" }));
		fireEvent.click(screen.getByRole("button", { name: "Cerrar" }));

		rerender(<MovementDetailSheet open onOpenChange={() => undefined} movement={expenseB} />);

		expect(screen.getByRole("heading", { name: "Detalle del movimiento" })).toBeTruthy();
		expect(screen.queryByText("Listo")).toBeNull();
		expect(screen.getByText("Almuerzo")).toBeTruthy();
	});

	it("muestra el formulario al editar un ingreso con source y occurredAt", () => {
		render(<MovementDetailSheet open onOpenChange={() => undefined} movement={incomeA} />);

		fireEvent.click(screen.getByRole("button", { name: "Editar" }));
		expect(screen.getByRole("button", { name: "Guardar ingreso" })).toBeTruthy();
	});

	it("avisa si faltan campos para editar ingreso en lugar de quedarse en detalle", () => {
		render(
			<MovementDetailSheet open onOpenChange={() => undefined} movement={incomeMissingFields} />,
		);

		fireEvent.click(screen.getByRole("button", { name: "Editar" }));
		expect(screen.getByText(/No pudimos cargar los datos para editar este ingreso/i)).toBeTruthy();
		expect(screen.queryByRole("button", { name: "Guardar ingreso" })).toBeNull();
	});

	it("envuelve el contenido en una región animada ligada al título", () => {
		render(<MovementDetailSheet open onOpenChange={() => undefined} movement={expenseA} />);

		const title = screen.getByRole("heading", {
			name: "Detalle del movimiento",
		});
		expect(title.id).toBe("movement-sheet-title");

		const region = screen.getByRole("region");
		expect(region.getAttribute("aria-labelledby")).toBe("movement-sheet-title");
		expect(screen.getByRole("button", { name: "Editar" })).toBeTruthy();
	});

	it("pasa autoFocus al formulario de edición de gasto", () => {
		render(<MovementDetailSheet open onOpenChange={() => undefined} movement={expenseA} />);

		fireEvent.click(screen.getByRole("button", { name: "Editar" }));
		expect(screen.getByRole("button", { name: "Teclado 1" })).toBeTruthy();
	});

	it("pasa autoFocus al formulario de edición de ingreso", () => {
		render(<MovementDetailSheet open onOpenChange={() => undefined} movement={incomeA} />);

		fireEvent.click(screen.getByRole("button", { name: "Editar" }));
		expect(screen.getByRole("textbox", { name: "Monto" })).toBeTruthy();
	});
});
