"use client";

import { format } from "date-fns";
import { es } from "date-fns/locale";
import { useState } from "react";
import { Calendar as CalendarIcon } from "reicon-react/icons/Calendar";
import { Button } from "@/shared/components/ui/button";
import { Calendar } from "@/shared/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/shared/components/ui/popover";
import { cn } from "@/shared/lib/utils";

type DatePickerProps = {
	id?: string;
	value?: Date;
	onChange?: (date: Date | undefined) => void;
	placeholder?: string;
	disabled?: boolean;
	className?: string;
	formatValue?: (date: Date) => string;
	calendarProps?: Omit<React.ComponentProps<typeof Calendar>, "mode" | "selected" | "onSelect">;
};

function defaultFormatValue(date: Date): string {
	return format(date, "PPP", { locale: es });
}

export function DatePicker({
	id,
	value,
	onChange,
	placeholder = "Elige una fecha",
	disabled,
	className,
	formatValue = defaultFormatValue,
	calendarProps,
}: DatePickerProps) {
	const [open, setOpen] = useState(false);

	return (
		<Popover open={open} onOpenChange={setOpen}>
			<PopoverTrigger
				disabled={disabled}
				render={
					<Button
						id={id}
						type="button"
						variant="outline"
						disabled={disabled}
						className={cn(
							"w-full justify-start gap-2 px-3 font-normal",
							!value && "text-muted-foreground",
							className,
						)}
					/>
				}
			>
				<CalendarIcon size={18} color="currentColor" data-icon="inline-start" />
				{value ? formatValue(value) : placeholder}
			</PopoverTrigger>
			<PopoverContent className="w-auto p-0" align="start">
				<Calendar
					mode="single"
					locale={es}
					captionLayout="dropdown"
					selected={value}
					onSelect={(date) => {
						onChange?.(date);
						if (date) setOpen(false);
					}}
					{...calendarProps}
				/>
			</PopoverContent>
		</Popover>
	);
}
