import type { CycleMovementsResult } from "@/shared/lib/expenses/expense-record";
import { formatCents, formatCentsTrimmed } from "@/shared/lib/money";
import { marketFromCurrencyCode } from "@/shared/lib/onboarding/markets";

export type EditableExpense = {
	id: string;
	amountCents: number;
	description: string;
	envelopeType: "needs" | "wants";
};

export type RecentExpense = {
	_id: string;
	amount: number;
	description: string;
	timestamp: number;
	envelopeType?: "needs" | "wants" | "savings";
};

export type MovementFilter = (typeof MOVEMENT_FILTERS)[number]["id"];
export type MovementTone = "needs" | "wants" | "savings" | "income";
export type MovementMetaTone = "detected" | "note" | "muted";

export type MovementListRow = {
	id: string;
	kind: "expense" | "income";
	label: string;
	amountLabel: string;
	amountTone: "out" | "in";
	dot: MovementTone;
	meta: string | null;
	metaTone: MovementMetaTone | null;
	opensExpense: boolean;
};

export type MovementDayGroup = {
	key: string;
	title: string;
	totalLabel: string;
	rows: MovementListRow[];
};

export type MovementsListModel = {
	cycleLine: string;
	groups: MovementDayGroup[];
	isEmpty: boolean;
	isFilterEmpty: boolean;
};

export const MOVEMENT_FILTERS = [
	{ id: "all", label: "Todos" },
	{ id: "needs", label: "Necesidades" },
	{ id: "wants", label: "Gustos" },
	{ id: "savings", label: "Ahorro" },
] as const;

const LIMA = "America/Lima";
const MONTHS = [
	"ENE",
	"FEB",
	"MAR",
	"ABR",
	"MAY",
	"JUN",
	"JUL",
	"AGO",
	"SEP",
	"OCT",
	"NOV",
	"DIC",
] as const;

const TONE_BY_LABEL: Record<string, MovementTone> = {
	Necesidades: "needs",
	Gustos: "wants",
	Ahorro: "savings",
};

type CycleMovement = NonNullable<CycleMovementsResult>["movements"][number];

type BuiltRow = {
	id: string;
	kind: "expense" | "income";
	label: string;
	amountCents: number;
	direction: "out" | "in";
	tone: MovementTone;
	timestamp: number;
	meta: string | null;
	metaTone: MovementMetaTone | null;
};

type LimaStamp = {
	key: string;
	day: number;
	monthIndex: number;
	time: string;
};

export function presentMovementList(
	data: CycleMovementsResult | null,
	options: { filter: MovementFilter; query: string; now: number },
): MovementsListModel {
	const symbol = readSymbol(data);
	const nowStamp = limaStamp(options.now);
	const yesterdayKey = previousDayKey(nowStamp.key);
	const source: CycleMovement[] = data && Array.isArray(data.movements) ? data.movements : [];
	const built: BuiltRow[] = source.flatMap((movement: CycleMovement) => {
		const row = readRow(movement, nowStamp.key);
		return row ? [row] : [];
	});
	built.sort(
		(a: BuiltRow, b: BuiltRow) => b.timestamp - a.timestamp || a.label.localeCompare(b.label),
	);

	const visible = built.filter(
		(row: BuiltRow) =>
			matchesFilter(row.tone, options.filter) && matchesQuery(row.label, options.query),
	);

	return {
		cycleLine: formatCycleLine(readCycle(data), built.length),
		groups: groupByDay(visible, symbol, nowStamp.key, yesterdayKey),
		isEmpty: built.length === 0,
		isFilterEmpty: built.length > 0 && visible.length === 0,
	};
}

export function readRecentExpenses(value: unknown): RecentExpense[] {
	if (!Array.isArray(value)) return [];
	return value.flatMap((item) => {
		if (!item || typeof item !== "object") return [];
		const row = item as Record<string, unknown>;
		if (typeof row._id !== "string" || typeof row.amount !== "number") {
			return [];
		}
		const envelopeType = row.envelopeType;
		return [
			{
				_id: row._id,
				amount: row.amount,
				description: typeof row.description === "string" ? row.description : "",
				timestamp: typeof row.timestamp === "number" ? row.timestamp : 0,
				envelopeType:
					envelopeType === "needs" || envelopeType === "wants" || envelopeType === "savings"
						? envelopeType
						: undefined,
			},
		];
	});
}

export function editableFromRecentExpense(expense: {
	_id: string;
	amount: number;
	description: string;
	envelopeType?: "needs" | "wants" | "savings";
}): EditableExpense | null {
	if (expense.envelopeType !== "needs" && expense.envelopeType !== "wants") {
		return null;
	}
	return {
		id: expense._id,
		amountCents: expense.amount,
		description: expense.description,
		envelopeType: expense.envelopeType,
	};
}

function readRow(movement: CycleMovement, todayKey: string): BuiltRow | null {
	if (!movement || typeof movement.id !== "string" || movement.id.length === 0) {
		return null;
	}
	if (typeof movement.amount !== "number" || !Number.isFinite(movement.amount)) {
		return null;
	}
	if (typeof movement.timestamp !== "number" || !Number.isFinite(movement.timestamp)) {
		return null;
	}

	const label =
		typeof movement.label === "string" && movement.label.trim()
			? movement.label.trim()
			: "Movimiento";
	const stamp = limaStamp(movement.timestamp);
	const detected = readDetected(movement);

	if (movement.kind === "expense") {
		const meta = expenseMeta(detected, stamp.time, stamp.key === todayKey);
		return {
			id: movement.id,
			kind: "expense",
			label,
			amountCents: Math.trunc(movement.amount),
			direction: "out",
			tone: expenseTone(movement),
			timestamp: movement.timestamp,
			meta: meta?.text ?? null,
			metaTone: meta?.tone ?? null,
		};
	}

	if (movement.kind === "income") {
		const note = incomeMeta(movement);
		const meta: { text: string; tone: MovementMetaTone } | null = detected
			? { text: `DETECTADO · ${stamp.time}`, tone: "detected" }
			: note;
		return {
			id: movement.id,
			kind: "income",
			label,
			amountCents: Math.trunc(movement.amount),
			direction: "in",
			tone: "income",
			timestamp: movement.timestamp,
			meta: meta?.text ?? null,
			metaTone: meta?.tone ?? null,
		};
	}

	return null;
}

function expenseMeta(
	detected: boolean,
	time: string,
	isToday: boolean,
): { text: string; tone: MovementMetaTone } | null {
	if (detected) return { text: `DETECTADO · ${time}`, tone: "detected" };
	if (isToday) return { text: time, tone: "muted" };
	return null;
}

function incomeMeta(movement: CycleMovement): { text: string; tone: MovementMetaTone } | null {
	if (movement.kind !== "income") return null;
	const parts: string[] = [];
	if (movement.appliedByAutoRule === true) parts.push("AUTO");
	const extra =
		typeof movement.extraordinaryLabel === "string" ? movement.extraordinaryLabel.trim() : "";
	if (extra) parts.push(extra.toLocaleUpperCase("es-PE"));
	else if (movement.isExtraordinaryIncome === true) parts.push("EXTRAORDINARIO");
	if (movement.distributionPolicy === "all_to_savings") {
		parts.push("TODO A AHORRO");
	} else if (movement.distributionPolicy === "profile_default") {
		parts.push("REPARTIDO");
	}
	if (parts.length === 0) return null;
	const tone: MovementMetaTone =
		extra || movement.isExtraordinaryIncome === true ? "note" : "muted";
	return { text: parts.join(" · "), tone };
}

function expenseTone(movement: { envelopeType?: string; envelopeLabel?: string }): MovementTone {
	const type = movement.envelopeType;
	if (type === "needs" || type === "wants" || type === "savings") return type;
	const fromLabel = movement.envelopeLabel ? TONE_BY_LABEL[movement.envelopeLabel] : undefined;
	return fromLabel ?? "needs";
}

function readDetected(movement: object): boolean {
	if (!("detected" in movement)) return false;
	return movement.detected === true;
}

function matchesFilter(tone: MovementTone, filter: MovementFilter): boolean {
	if (filter === "all") return true;
	return tone === filter;
}

function matchesQuery(label: string, query: string): boolean {
	const needle = query.trim().toLocaleLowerCase("es-PE");
	if (!needle) return true;
	return label.toLocaleLowerCase("es-PE").includes(needle);
}

function groupByDay(
	rows: BuiltRow[],
	symbol: string,
	todayKey: string,
	yesterdayKey: string,
): MovementDayGroup[] {
	const groups: Array<MovementDayGroup & { totalCents: number }> = [];
	for (const row of rows) {
		const stamp = limaStamp(row.timestamp);
		const existing = groups.find((group) => group.key === stamp.key);
		const group = existing ?? {
			key: stamp.key,
			title: dayTitle(stamp, todayKey, yesterdayKey),
			totalLabel: "",
			totalCents: 0,
			rows: [],
		};
		if (!existing) groups.push(group);
		const signed = row.direction === "out" ? -Math.abs(row.amountCents) : Math.abs(row.amountCents);
		group.totalCents += signed;
		group.rows.push({
			id: row.id,
			kind: row.kind,
			label: row.label,
			amountLabel: formatSigned(signed, symbol, row.direction === "in"),
			amountTone: row.direction,
			dot: row.tone,
			meta: row.meta,
			metaTone: row.metaTone,
			opensExpense: row.kind === "expense",
		});
	}
	return groups.map((group) => ({
		key: group.key,
		title: group.title,
		totalLabel: formatSigned(group.totalCents, symbol, false),
		rows: group.rows,
	}));
}

function formatSigned(cents: number, symbol: string, trim: boolean): string {
	const body = trim
		? formatCentsTrimmed(Math.abs(cents), symbol)
		: formatCents(Math.abs(cents), symbol);
	if (cents > 0) return `+ ${body}`;
	if (cents < 0) return `− ${body}`;
	return body;
}

function formatCycleLine(
	cycle: { startDate: number; endDate: number } | null,
	count: number,
): string {
	const records = count === 1 ? "1 REGISTRO" : `${count} REGISTROS`;
	if (!cycle) return records;
	return `CICLO ${cycleRange(cycle.startDate, cycle.endDate)} · ${records}`;
}

function cycleRange(startDate: number, endDate: number): string {
	const start = limaStamp(startDate);
	const end = limaStamp(endDate - 1);
	const startMonth = MONTHS[start.monthIndex] ?? "";
	const endMonth = MONTHS[end.monthIndex] ?? "";
	if (start.monthIndex === end.monthIndex) {
		return `${start.day} – ${end.day} ${endMonth}`;
	}
	return `${start.day} ${startMonth} – ${end.day} ${endMonth}`;
}

function readCycle(
	data: CycleMovementsResult | null,
): { startDate: number; endDate: number } | null {
	if (!data?.cycle) return null;
	const { startDate, endDate } = data.cycle;
	if (typeof startDate !== "number" || typeof endDate !== "number") return null;
	if (!(endDate > startDate)) return null;
	return { startDate, endDate };
}

function readSymbol(data: CycleMovementsResult | null): string {
	const code = data && typeof data.currencyCode === "string" ? data.currencyCode : "";
	return marketFromCurrencyCode(code)?.currencySymbol ?? "S/";
}

function dayTitle(stamp: LimaStamp, todayKey: string, yesterdayKey: string): string {
	const month = MONTHS[stamp.monthIndex] ?? "";
	const date = `${stamp.day} ${month}`;
	if (stamp.key === todayKey) return `HOY · ${date}`;
	if (stamp.key === yesterdayKey) return `AYER · ${date}`;
	return date;
}

function limaStamp(ms: number): LimaStamp {
	const parts = new Intl.DateTimeFormat("en-US", {
		timeZone: LIMA,
		year: "numeric",
		month: "2-digit",
		day: "2-digit",
		hour: "2-digit",
		minute: "2-digit",
		hourCycle: "h23",
	}).formatToParts(new Date(ms));
	const read = (type: Intl.DateTimeFormatPartTypes) =>
		parts.find((part) => part.type === type)?.value ?? "";
	const month = Number(read("month"));
	return {
		key: `${read("year")}-${read("month")}-${read("day")}`,
		day: Number(read("day")),
		monthIndex: Number.isFinite(month) ? month - 1 : 0,
		time: `${read("hour").padStart(2, "0")}:${read("minute").padStart(2, "0")}`,
	};
}

function previousDayKey(key: string): string {
	const [year, month, day] = key.split("-").map(Number);
	const date = new Date(Date.UTC(year ?? 1970, (month ?? 1) - 1, day ?? 1));
	date.setUTCDate(date.getUTCDate() - 1);
	const nextMonth = String(date.getUTCMonth() + 1).padStart(2, "0");
	const nextDay = String(date.getUTCDate()).padStart(2, "0");
	return `${date.getUTCFullYear()}-${nextMonth}-${nextDay}`;
}
