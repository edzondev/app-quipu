import type { ReactNode } from "react";
import { cn } from "@/shared/lib/utils";

type CellArea =
	| "general"
	| "allocation"
	| "cycle"
	| "participation"
	| "members"
	| "status"
	| "danger";

const CELL_LAYOUT: Record<CellArea, string> = {
	general: "lg:col-span-4 lg:col-start-1 lg:row-start-1",
	allocation: "lg:col-span-8 lg:col-start-5 lg:row-start-1 lg:row-span-2",
	cycle: "lg:col-span-4 lg:col-start-1 lg:row-start-2",
	participation: "lg:col-span-12 lg:row-start-4",
	members: "lg:col-span-4 lg:col-start-5 lg:row-start-3",
	status: "lg:col-span-4 lg:col-start-9 lg:row-start-3",
	danger: "lg:col-span-12 lg:row-start-5",
};

type GridProps = {
	children: ReactNode;
};

type CellProps = {
	area: CellArea;
	children: ReactNode;
};

export function SpaceSettingsBentoGrid({ children }: GridProps) {
	return (
		<div className="mt-5 grid grid-cols-1 gap-3 lg:grid-cols-12 lg:auto-rows-min lg:gap-4">
			{children}
		</div>
	);
}

export function SpaceSettingsBentoCell({ area, children }: CellProps) {
	return <div className={cn("min-w-0", CELL_LAYOUT[area], "[&>section]:h-full")}>{children}</div>;
}
