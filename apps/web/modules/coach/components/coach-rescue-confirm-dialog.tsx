"use client";

import { useMutation } from "convex/react";
import { useState } from "react";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { AnalyticsEvents, track } from "@/core/analytics";
import { AnimatedView } from "@/shared/components/ui/animated-view";
import { Button } from "@/shared/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@/shared/components/ui/dialog";
import { formatCents } from "@/shared/lib/money";
import {
	RESCUE_CONFIRM_APPLY_CTA,
	RESCUE_CONFIRM_DISMISS_CTA,
	RESCUE_CONFIRM_TITLE,
} from "../constants";
import { handleRescueApply } from "../lib/handle-rescue-apply";

type RescueSuggestion = {
	transfer: number;
	projectedDeficit: number;
};

type Props = {
	interactionId: Id<"coachInteractions">;
	currencyCode: string;
	open: boolean;
	suggestion: RescueSuggestion;
	onOpenChange: (open: boolean) => void;
};

export function CoachRescueConfirmDialog({
	interactionId,
	currencyCode,
	open,
	suggestion,
	onOpenChange,
}: Props) {
	const applyRescue = useMutation(api.coachEngine.applyRescueTransfer);
	const dismissRescue = useMutation(api.coachEngine.dismissRescueSuggestion);
	const [isSubmitting, setIsSubmitting] = useState(false);

	async function handleApply() {
		setIsSubmitting(true);
		const result = await handleRescueApply({
			applyRescue,
			interactionId,
		}).finally(() => {
			setIsSubmitting(false);
		});
		if (result.kind === "error") {
			return;
		}
		track(AnalyticsEvents.COACH_RECOMMENDATION_INTERACTED, {
			recommendation_type: "rescue_transfer",
			interaction: "selected",
			transfer_amount: result.transfer,
		});
		onOpenChange(false);
	}

	async function handleDismiss() {
		setIsSubmitting(true);
		await dismissRescue({ interactionId })
			.then(() => {
				track(AnalyticsEvents.COACH_RECOMMENDATION_INTERACTED, {
					recommendation_type: "rescue_transfer",
					interaction: "dismissed",
					transfer_amount: suggestion.transfer,
				});
				onOpenChange(false);
			})
			.finally(() => {
				setIsSubmitting(false);
			});
	}

	const titleId = "coach-rescue-confirm-title";
	const contentKey = `${interactionId}-${suggestion.transfer}-${suggestion.projectedDeficit}`;

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent showCloseButton={false} className="rounded-[14px]">
				<AnimatedView viewKey={contentKey} aria-labelledby={titleId}>
					<DialogHeader>
						<DialogTitle id={titleId} className="font-serif text-xl text-ink">
							{RESCUE_CONFIRM_TITLE}
						</DialogTitle>
						<DialogDescription className="text-sm leading-relaxed text-ink-secondary">
							Transferir{" "}
							<strong className="font-semibold text-ink">
								{formatCents(suggestion.transfer, { currency: currencyCode })}
							</strong>{" "}
							de Ahorro a Gustos para cubrir{" "}
							<strong className="font-semibold text-ink">
								{formatCents(suggestion.projectedDeficit, {
									currency: currencyCode,
								})}
							</strong>{" "}
							de déficit. Esta acción mueve dinero entre sobres; no registra un gasto nuevo.
						</DialogDescription>
					</DialogHeader>
					<DialogFooter className="mt-4 gap-2 sm:justify-stretch">
						<Button
							type="button"
							variant="outline"
							className="rounded-[11px]"
							disabled={isSubmitting}
							onClick={() => void handleDismiss()}
						>
							{RESCUE_CONFIRM_DISMISS_CTA}
						</Button>
						<Button
							type="button"
							className="rounded-[11px] bg-ink text-canvas hover:bg-ink/90"
							disabled={isSubmitting}
							onClick={() => void handleApply()}
						>
							{RESCUE_CONFIRM_APPLY_CTA}
						</Button>
					</DialogFooter>
				</AnimatedView>
			</DialogContent>
		</Dialog>
	);
}
