"use client";

import { useMutation } from "convex/react";
import { useState } from "react";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { Button } from "@/shared/components/ui/button";
import { CoachRescueConfirmDialog } from "./coach-rescue-confirm-dialog";

type CoachOption = {
	id: string;
	label: string;
};

type RescueSuggestion = {
	transfer: number;
	projectedDeficit: number;
};

type Props = {
	interactionId: Id<"coachInteractions">;
	options: CoachOption[];
	currencyCode: string;
	rescueSuggestion?: RescueSuggestion;
	awaitingRescueConfirmation?: boolean;
};

export function CoachNudgeActions({
	interactionId,
	rescueSuggestion,
	awaitingRescueConfirmation = false,
	...props
}: Props) {
	const dialogKey = [
		interactionId,
		awaitingRescueConfirmation ? "awaiting" : "idle",
		rescueSuggestion?.transfer ?? "none",
		rescueSuggestion?.projectedDeficit ?? "none",
	].join(":");

	return (
		<CoachNudgeActionsInner
			key={dialogKey}
			interactionId={interactionId}
			rescueSuggestion={rescueSuggestion}
			awaitingRescueConfirmation={awaitingRescueConfirmation}
			{...props}
		/>
	);
}

function CoachNudgeActionsInner({
	interactionId,
	options,
	currencyCode,
	rescueSuggestion,
	awaitingRescueConfirmation = false,
}: Props) {
	const resolveNudge = useMutation(api.coachEngine.resolveNudgeAction);
	const initialSuggestion = awaitingRescueConfirmation ? rescueSuggestion : undefined;
	const [dialogOpen, setDialogOpen] = useState(Boolean(initialSuggestion));
	const [activeSuggestion, setActiveSuggestion] = useState<RescueSuggestion | undefined>(
		initialSuggestion,
	);

	const showOptionButtons = !awaitingRescueConfirmation && !dialogOpen;

	async function handleOptionClick(optionId: CoachOption["id"]) {
		const result = await resolveNudge({
			interactionId,
			optionId: optionId as "freeze_wants" | "suggest_rescue" | "ignore",
		});

		if (result.mode === "suggested" && result.suggestion) {
			setActiveSuggestion(result.suggestion);
			setDialogOpen(true);
		}
	}

	return (
		<>
			{showOptionButtons ? (
				<div className="mt-4 flex flex-wrap gap-2">
					{options.map((option) => (
						<Button
							key={option.id}
							type="button"
							size="sm"
							variant={option.id === "ignore" ? "outline" : "secondary"}
							onClick={() => void handleOptionClick(option.id)}
						>
							{option.label}
						</Button>
					))}
				</div>
			) : null}

			{activeSuggestion ? (
				<CoachRescueConfirmDialog
					interactionId={interactionId}
					currencyCode={currencyCode}
					open={dialogOpen}
					suggestion={activeSuggestion}
					onOpenChange={setDialogOpen}
				/>
			) : null}
		</>
	);
}
