"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import type { Id } from "@/convex/_generated/dataModel";
import { currencyReadOnlyLabel } from "@/core/constants";
import { fromConvexError } from "@/core/errors";
import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";
import { useUpdateSpaceName } from "../actions";
import {
	ESPACIOS_SETTINGS_CURRENCY_LABEL,
	ESPACIOS_SETTINGS_GENERAL,
	ESPACIOS_SETTINGS_NAME_LABEL,
	ESPACIOS_SETTINGS_NAME_SAVE,
	ESPACIOS_SETTINGS_NAME_SAVED,
} from "../constants";
import { canEditSpaceSettingsSection } from "../lib/space-settings-permissions";
import type { SpaceSettings } from "../queries";

import { SpaceSection } from "./space-section";

type Props = {
	spaceId: Id<"financialSpaces">;
	settings: SpaceSettings;
};

export function SpaceSettingsGeneralSection({ spaceId, settings }: Props) {
	const updateName = useUpdateSpaceName();
	const [name, setName] = useState(settings.space.name);
	const [syncedName, setSyncedName] = useState(settings.space.name);
	if (syncedName !== settings.space.name) {
		setSyncedName(settings.space.name);
		setName(settings.space.name);
	}
	const [isPending, startTransition] = useTransition();

	const canEditName = canEditSpaceSettingsSection(
		settings.viewerRole,
		settings.space.status,
		"name",
		{ isWritable: settings.isWritable },
	);

	function saveName() {
		const trimmed = name.trim();
		if (!canEditName || trimmed === settings.space.name) return;
		startTransition(async () => {
			try {
				await updateName({ spaceId, name: trimmed });
				toast.success(ESPACIOS_SETTINGS_NAME_SAVED);
			} catch (error) {
				toast.error(fromConvexError(error).message);
			}
		});
	}

	return (
		<SpaceSection title={ESPACIOS_SETTINGS_GENERAL}>
			<div className="space-y-4">
				<div>
					<label
						htmlFor="space-settings-name"
						className="text-[12.5px] font-medium text-ink-secondary"
					>
						{ESPACIOS_SETTINGS_NAME_LABEL}
					</label>
					<Input
						id="space-settings-name"
						className="mt-1.5"
						value={name}
						disabled={!canEditName || isPending}
						onChange={(event) => setName(event.target.value)}
						onKeyDown={(event) => {
							if (event.key === "Enter") saveName();
						}}
					/>
					{canEditName ? (
						<Button
							type="button"
							variant="outline"
							size="sm"
							className="mt-3 border-line text-body-secondary"
							disabled={
								isPending || name.trim().length === 0 || name.trim() === settings.space.name
							}
							onClick={saveName}
						>
							{isPending ? "Guardando…" : ESPACIOS_SETTINGS_NAME_SAVE}
						</Button>
					) : null}
				</div>

				<div className="flex items-center justify-between gap-3 border-t border-line-subtle pt-4">
					<span className="text-sm text-ink">{ESPACIOS_SETTINGS_CURRENCY_LABEL}</span>
					<span className="text-[13.5px] text-mute">
						{currencyReadOnlyLabel(settings.space.currencyCode, settings.space.currencySymbol)}
					</span>
				</div>
			</div>
		</SpaceSection>
	);
}
