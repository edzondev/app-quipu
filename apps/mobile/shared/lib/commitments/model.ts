import type { api } from "@quipu/convex-api";
import type { FunctionArgs, FunctionReturnType } from "convex/server";
import { parseAmountToCents } from "@/shared/lib/expenses/amount";
import { LIMA_MONTHS, limaDayLabel, limaStamp } from "@/shared/lib/lima-date";
import { formatCentsTrimmed } from "@/shared/lib/money";
import { marketFromCurrencyCode } from "@/shared/lib/onboarding/markets";

export type CommitmentCoverage = FunctionReturnType<
	typeof api.fixedCommitments.getCommitmentCoverage
>;

export type CreateCommitmentArgs = FunctionArgs<typeof api.fixedCommitments.createFixedCommitment>;

export type CoverageRow = NonNullable<CommitmentCoverage>["commitments"][number];

export type CommitmentStatusTone = "calm" | "fast" | "muted";

export type CommitmentRowView = {
	id: string;
	name: string;
	meta: string;
	metaTone: "soon" | "muted";
	amountLabel: string;
	amountMuted: boolean;
	statusLabel: string;
	statusTone: CommitmentStatusTone;
};

export type CommitmentsScreenModel = {
	totalLabel: string;
	paidLabel: string;
	pendingLabel: string;
	paidPercent: number;
	rows: CommitmentRowView[];
};

export type CommitmentFormValues = {
	name: string;
	amountRaw: string;
	dueDay: string;
	envelope: CreateCommitmentArgs["envelope"];
};

export type CommitmentField = keyof CommitmentFormValues;

export type CommitmentDraftResult =
	| { ok: true; args: CreateCommitmentArgs }
	| { ok: false; fields: Partial<Record<CommitmentField, string>> };

export function emptyCommitments(symbol = "S/"): CommitmentsScreenModel {
	return {
		totalLabel: formatCentsTrimmed(0, symbol),
		paidLabel: `PAGADO ${formatCentsTrimmed(0, symbol)}`,
		pendingLabel: `PENDIENTE ${formatCentsTrimmed(0, symbol)}`,
		paidPercent: 0,
		rows: [],
	};
}

export function presentCommitments(
	coverage: NonNullable<CommitmentCoverage>,
): CommitmentsScreenModel {
	const symbol = marketFromCurrencyCode(coverage.currencyCode)?.currencySymbol ?? "S/";
	const ordered = [...coverage.commitments].sort((a, b) => {
		const aPaid = a.paymentStatus === "paid";
		const bPaid = b.paymentStatus === "paid";
		if (aPaid !== bPaid) return aPaid ? 1 : -1;
		return a.daysUntilDue - b.daysUntilDue;
	});
	let paidCents = 0;
	for (const row of coverage.commitments) {
		if (row.paymentStatus === "paid") paidCents += row.amount;
	}
	const totalCents = coverage.totalCents;
	const pendingCents = totalCents - paidCents;
	const paidPercent = totalCents > 0 ? clampPercent((paidCents / totalCents) * 100) : 0;

	return {
		totalLabel: formatCentsTrimmed(totalCents, symbol),
		paidLabel: `PAGADO ${formatCentsTrimmed(paidCents, symbol)}`,
		pendingLabel: `PENDIENTE ${formatCentsTrimmed(pendingCents, symbol)}`,
		paidPercent,
		rows: ordered.map((row) => toRow(row, symbol)),
	};
}

export function toCreateCommitment(values: CommitmentFormValues): CommitmentDraftResult {
	const name = values.name.trim();
	if (!name) {
		return { ok: false, fields: { name: "El nombre del compromiso es obligatorio." } };
	}
	const amount = parseAmountToCents(values.amountRaw);
	if (amount == null || amount <= 0) {
		return { ok: false, fields: { amountRaw: "El monto debe ser mayor a cero." } };
	}
	const dueDay = parseDueDay(values.dueDay);
	if (dueDay == null) {
		return { ok: false, fields: { dueDay: DUE_DAY_ERROR } };
	}
	return { ok: true, args: { name, amount, dueDay, envelope: values.envelope } };
}

export const DUE_DAY_ERROR = "El día de vencimiento va del 1 al 31.";

/** Día del mes válido (1–31) o null. El servidor lleva el 29–31 al último día de los meses cortos. */
export function parseDueDay(raw: string): number | null {
	const day = Number(raw.trim());
	return Number.isInteger(day) && day >= 1 && day <= 31 ? day : null;
}

/** Aviso bajo el campo de día: mismo cálculo que el servidor para el próximo vencimiento. */
export function dueDayHint(raw: string, now: number): string {
	const base = "Se repite cada mes.";
	const day = parseDueDay(raw);
	if (day == null) return base;
	const short = day > 28 ? " En meses cortos vence el último día." : "";
	return `${base} Próximo: ${nextDueLabel(day, now)}.${short}`;
}

function nextDueLabel(dueDay: number, now: number): string {
	const today = limaStamp(now);
	const year = Number(today.key.slice(0, 4));
	const monthIndex = today.monthIndex + (dueDay >= today.day ? 0 : 1);
	const lastDay = new Date(Date.UTC(year, monthIndex + 1, 0)).getUTCDate();
	return `${Math.min(dueDay, lastDay)} ${LIMA_MONTHS[monthIndex % 12]}`;
}

function toRow(row: CoverageRow, symbol: string): CommitmentRowView {
	const paid = row.paymentStatus === "paid";
	const status = rowStatus(row);
	const meta = rowMeta(row);
	return {
		id: row.id,
		name: row.name.trim() || "Compromiso",
		meta: meta.label,
		metaTone: meta.tone,
		amountLabel: formatCentsTrimmed(row.amount, symbol),
		amountMuted: paid,
		statusLabel: status.label,
		statusTone: status.tone,
	};
}

function rowStatus(row: CoverageRow): {
	label: string;
	tone: CommitmentStatusTone;
} {
	if (row.paymentStatus === "paid") return { label: "Pagado", tone: "muted" };
	if (row.paymentStatus === "overdue") return { label: "Vencido", tone: "fast" };
	if (row.coverageStatus === "covered") return { label: "Cubierto", tone: "calm" };
	if (row.coverageStatus === "partial") return { label: "Parcial", tone: "fast" };
	return { label: "Sin cubrir", tone: "muted" };
}

function rowMeta(row: CoverageRow): { label: string; tone: "soon" | "muted" } {
	if (row.paymentStatus === "paid") {
		const when = row.paidAtForCycle == null ? "" : ` ${limaDayLabel(row.paidAtForCycle)}`;
		return { label: `PAGADO${when}`, tone: "muted" };
	}
	const stamp = limaDayLabel(row.nextDueAt);
	if (row.daysUntilDue < 0) return { label: `VENCIDO · ${stamp}`, tone: "soon" };
	if (row.daysUntilDue === 0) {
		return { label: `VENCE HOY · ${stamp}`, tone: "soon" };
	}
	if (row.daysUntilDue === 1) {
		return { label: `VENCE MAÑANA · ${stamp}`, tone: "soon" };
	}
	return { label: `${stamp} · MENSUAL`, tone: "muted" };
}

function clampPercent(value: number): number {
	if (!Number.isFinite(value)) return 0;
	return Math.min(100, Math.max(0, Math.round(value)));
}
