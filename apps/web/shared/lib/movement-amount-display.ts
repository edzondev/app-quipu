export type MovementAmountKind = "income" | "contribution" | "expense";

export function isMovementInflow(kind: MovementAmountKind): boolean {
	return kind === "income" || kind === "contribution";
}

/** Clases de monto: verde para ingreso/aporte, rojo para gasto. */
export function movementAmountClassName(kind: MovementAmountKind): string {
	return isMovementInflow(kind) ? "text-qp-deep" : "text-danger-ink";
}

export function movementAmountPrefix(kind: MovementAmountKind): string {
	return isMovementInflow(kind) ? "+" : "−";
}

export function movementDotClassName(kind: MovementAmountKind): string {
	return isMovementInflow(kind) ? "bg-qp" : "bg-danger";
}
