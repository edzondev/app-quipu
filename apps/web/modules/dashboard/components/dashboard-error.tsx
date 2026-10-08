"use client";

import { Button } from "@/shared/components/ui/button";
import { DASHBOARD_ERROR_BODY, DASHBOARD_ERROR_RETRY, DASHBOARD_ERROR_TITLE } from "../constants";

type Props = {
	onRetry?: () => void;
};

export function DashboardError({ onRetry }: Props) {
	return (
		<section className="rounded-xl border border-danger-line bg-danger-bg p-5 md:p-6">
			<h2 className="text-base font-semibold text-danger-ink">{DASHBOARD_ERROR_TITLE}</h2>
			<p className="mt-2 text-sm text-danger-text">{DASHBOARD_ERROR_BODY}</p>
			<Button
				type="button"
				variant="outline"
				className="mt-4 border-danger-line text-danger-ink hover:bg-danger-banner"
				onClick={() => onRetry?.() ?? window.location.reload()}
			>
				{DASHBOARD_ERROR_RETRY}
			</Button>
		</section>
	);
}
