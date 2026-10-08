export type ReservationLedgerRow = {
	reservedCents: number;
	consumedCents: number;
	releasedCents: number;
	status: "active" | "partially_consumed" | "consumed" | "released";
};

export type CommitmentReservationDisplayStatus =
	| "pending"
	| "partially_reserved"
	| "fully_reserved"
	| "paid"
	| "cancelled";

export function activeReservedCents(row: ReservationLedgerRow): number {
	return Math.max(0, row.reservedCents - row.consumedCents - row.releasedCents);
}

export function sumActiveReservedCents(rows: ReadonlyArray<ReservationLedgerRow>): number {
	return rows.reduce((sum, row) => {
		if (row.status === "released" || row.status === "consumed") return sum;
		return sum + activeReservedCents(row);
	}, 0);
}

export function resolveReservationDisplayStatus(input: {
	commitmentAmountCents: number;
	activeReservedCents: number;
	isPaid: boolean;
	isCancelled?: boolean;
}): CommitmentReservationDisplayStatus {
	if (input.isCancelled) return "cancelled";
	if (input.isPaid) return "paid";
	if (input.activeReservedCents <= 0) return "pending";
	if (input.activeReservedCents >= input.commitmentAmountCents) {
		return "fully_reserved";
	}
	return "partially_reserved";
}

export function applyPayFromReservations(input: {
	dueCents: number;
	reservations: Array<ReservationLedgerRow & { id: string }>;
}): {
	fromReserveCents: number;
	remainderCents: number;
	reservationPatches: Array<{
		id: string;
		consumedCents: number;
		status: ReservationLedgerRow["status"];
	}>;
} {
	let need = Math.max(0, input.dueCents);
	let fromReserveCents = 0;
	const reservationPatches: Array<{
		id: string;
		consumedCents: number;
		status: ReservationLedgerRow["status"];
	}> = [];

	for (const row of input.reservations) {
		if (need <= 0) break;
		const available = activeReservedCents(row);
		if (available <= 0) continue;
		const take = Math.min(need, available);
		const consumedCents = row.consumedCents + take;
		const remainingAfter = row.reservedCents - consumedCents - row.releasedCents;
		const status: ReservationLedgerRow["status"] =
			remainingAfter <= 0 ? "consumed" : "partially_consumed";
		reservationPatches.push({ id: row.id, consumedCents, status });
		fromReserveCents += take;
		need -= take;
	}

	return {
		fromReserveCents,
		remainderCents: need,
		reservationPatches,
	};
}

export function applyReleaseReservation(input: {
	row: ReservationLedgerRow;
	releaseCents?: number;
}): {
	releasedCents: number;
	status: ReservationLedgerRow["status"];
	returnedToUnallocatedCents: number;
} {
	const available = activeReservedCents(input.row);
	const releaseCents = Math.min(available, input.releaseCents ?? available);
	const releasedCents = input.row.releasedCents + releaseCents;
	const remaining = input.row.reservedCents - input.row.consumedCents - releasedCents;
	return {
		releasedCents,
		status: remaining <= 0 ? "released" : input.row.status,
		returnedToUnallocatedCents: releaseCents,
	};
}

/**
 * I1 — Pagado es solo señal: libera reservas activas del compromiso.
 * No consume sobres ni inventa gastos; el gasto real es otro movimiento.
 */
export function buildPaidSignalReservationPatches(
	reservations: Array<ReservationLedgerRow & { id: string }>,
): Array<{
	id: string;
	releasedCents: number;
	status: ReservationLedgerRow["status"];
	returnedCents: number;
}> {
	const patches: Array<{
		id: string;
		releasedCents: number;
		status: ReservationLedgerRow["status"];
		returnedCents: number;
	}> = [];

	for (const row of reservations) {
		if (row.status === "released" || row.status === "consumed") continue;
		if (activeReservedCents(row) <= 0) continue;
		const released = applyReleaseReservation({ row });
		patches.push({
			id: row.id,
			releasedCents: released.releasedCents,
			status: released.status,
			returnedCents: released.returnedToUnallocatedCents,
		});
	}

	return patches;
}
