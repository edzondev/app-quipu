const MONTHS = [
	"ene",
	"feb",
	"mar",
	"abr",
	"may",
	"jun",
	"jul",
	"ago",
	"sep",
	"oct",
	"nov",
	"dic",
] as const;

export type FormattedCycle =
	| { kind: "range"; start: string; end: string }
	| { kind: "text"; value: string };

export function formatCycle(
	paydays: number[],
	payFrequency: "monthly" | "biweekly",
): FormattedCycle {
	const now = new Date();
	const day = paydays[0] ?? 1;
	const start = new Date(now.getFullYear(), now.getMonth(), day);

	if (payFrequency === "biweekly" && paydays.length >= 2) {
		const [d1, d2] = [...paydays].sort((a, b) => a - b);
		return {
			kind: "text",
			value: `${d1} y ${d2} ${MONTHS[now.getMonth()]}`,
		};
	}

	const end = new Date(start);
	end.setMonth(end.getMonth() + 1);
	return {
		kind: "range",
		start: `${start.getDate()} ${MONTHS[start.getMonth()]}`,
		end: `${end.getDate()} ${MONTHS[end.getMonth()]}`,
	};
}
