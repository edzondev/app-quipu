"use client";

import { useState } from "react";
import { cn } from "@/shared/lib/utils";
import {
	SETTINGS_EXPORT_DATA,
	SETTINGS_EXPORT_DATA_ERROR,
	SETTINGS_EXPORT_DATA_PREPARING,
} from "../constants";

type Props = {
	className?: string;
	onExport?: () => Promise<void>;
};

/** D3 — portabilidad (Ley 29733): descarga JSON con todos los datos del usuario. */
export function SettingsExportDataItem({ className, onExport }: Props) {
	const [isExporting, setIsExporting] = useState(false);
	const [hasError, setHasError] = useState(false);

	const handleExport = async () => {
		if (!onExport) return;
		setIsExporting(true);
		setHasError(false);
		try {
			await onExport();
		} catch {
			setHasError(true);
		}
		setIsExporting(false);
	};

	return (
		<span className={cn("flex min-w-0 flex-1 flex-col", className)}>
			<button
				type="button"
				className="flex min-h-11 w-full items-center py-2.5 text-left text-[13.5px] text-ink transition-colors hover:text-qp-deep disabled:opacity-60"
				onClick={() => void handleExport()}
				disabled={isExporting || !onExport}
			>
				{isExporting ? SETTINGS_EXPORT_DATA_PREPARING : SETTINGS_EXPORT_DATA}
			</button>
			{hasError ? (
				<p className="pb-1 text-[12px] text-danger-ink" role="alert">
					{SETTINGS_EXPORT_DATA_ERROR}
				</p>
			) : null}
		</span>
	);
}
