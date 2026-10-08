"use client";

import { es } from "date-fns/locale";
import { useMemo, useState } from "react";
import { LIMA_TIMEZONE } from "@/core/constants";
import { DatePicker } from "@/shared/components/ui/date-picker";
import { Field, FieldDescription, FieldLabel } from "@/shared/components/ui/field";
import {
	getLimaDateParts,
	limaDatePartsToTimestamp,
	limaIncomeDateMinTimestamp,
	limaStartOfDay,
} from "@/shared/lib/date";
import { cn } from "@/shared/lib/utils";
import { INCOME_DATE_HINT, INCOME_DATE_LABEL } from "../constants";
import { formatIncomeDateLabel } from "../lib/incomeForm";

type Props = {
	id?: string;
	value: number;
	onChange: (timestamp: number) => void;
	className?: string;
};

function calendarDateFromTimestamp(timestamp: number): Date {
	const { year, month, day } = getLimaDateParts(timestamp);
	return new Date(limaDatePartsToTimestamp({ year, month, day }) + 12 * 60 * 60 * 1000);
}

export function IncomeDatePicker({ id = "income-date", value, onChange, className }: Props) {
	const [now] = useState(() => Date.now());

	const minTimestamp = useMemo(() => limaIncomeDateMinTimestamp(now), [now]);
	const maxTimestamp = useMemo(() => limaStartOfDay(now), [now]);
	const summaryLabel = formatIncomeDateLabel(value, now);
	const selectedDate = useMemo(() => calendarDateFromTimestamp(value), [value]);

	const minDate = useMemo(() => calendarDateFromTimestamp(minTimestamp), [minTimestamp]);
	const maxDate = useMemo(() => calendarDateFromTimestamp(maxTimestamp), [maxTimestamp]);

	function clampTimestamp(timestamp: number): number {
		if (timestamp < minTimestamp) return minTimestamp;
		if (timestamp > maxTimestamp) return maxTimestamp;
		return timestamp;
	}

	function handleSelect(date: Date | undefined) {
		if (!date) return;
		const parts = getLimaDateParts(date.getTime());
		onChange(clampTimestamp(limaDatePartsToTimestamp(parts)));
	}

	return (
		<Field className={cn("max-w-[320px]", className)}>
			<FieldLabel htmlFor={id} className="text-[12.5px] font-medium text-ink-secondary">
				{INCOME_DATE_LABEL}
			</FieldLabel>
			<DatePicker
				id={id}
				value={selectedDate}
				onChange={handleSelect}
				placeholder="Elige la fecha del depósito"
				className="h-[46px] rounded-[11px] border-line bg-card text-[14.5px] text-ink shadow-none hover:bg-card"
				calendarProps={{
					locale: es,
					timeZone: LIMA_TIMEZONE,
					defaultMonth: selectedDate,
					startMonth: minDate,
					endMonth: maxDate,
					disabled: {
						before: minDate,
						after: maxDate,
					},
				}}
			/>
			<FieldDescription className="text-[12px] leading-relaxed text-mute">
				<span className="font-medium text-ink-secondary">{summaryLabel}</span>
				{" · "}
				{INCOME_DATE_HINT}
			</FieldDescription>
		</Field>
	);
}
