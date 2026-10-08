"use client";
import { useState } from "react";
import { LockKeyholeOpen } from "reicon-react/icons/LockKeyholeOpen";
import { authClient } from "@/auth/auth-client";
import { AnalyticsEvents, track } from "@/core/analytics";
import { Button } from "@/shared/components/ui/button";
import { authPrimaryButtonClass } from "../constants";

type PassKeyProps = {
	onDone: VoidFunction;
};

export function PasskeySetup({ onDone }: PassKeyProps) {
	const [pending, setPending] = useState(false);
	const [message, setMessage] = useState<string | null>(null);

	async function handleCreate() {
		setPending(true);
		setMessage(null);
		const { error } = await authClient.passkey.addPasskey().finally(() => {
			setPending(false);
		});
		if (error) {
			setMessage("No se completó. Puedes intentarlo de nuevo cuando quieras.");
			return;
		}
		track(AnalyticsEvents.PASSKEY_CREATED, {});
		onDone();
	}

	return (
		<div className="flex flex-col items-center text-center">
			<div className="mb-7.5 flex size-33 items-center justify-center rounded-[30px] border border-qp-shield-line shadow-shield bg-[linear-gradient(160deg,var(--qp-shield-from),var(--qp-shield-to))]">
				<LockKeyholeOpen size={64} weight="Filled" color="var(--qp)" />
			</div>
			<h1 className="font-serif font-medium text-[30px] text-ink">Entra sin contraseñas</h1>
			<p className="mt-2.5 max-w-100 text-[15px] text-mute leading-[1.55]">
				Usa tu huella, rostro o PIN del dispositivo. Más rápido y más seguro que una contraseña.
			</p>
			<div className="mt-7.5 w-full max-w-85 space-y-2.75">
				<Button
					type="button"
					onClick={handleCreate}
					disabled={pending}
					className={authPrimaryButtonClass}
				>
					{pending ? "Esperando confirmación..." : "Crear passkey"}
				</Button>
				<Button
					type="button"
					variant="ghost"
					onClick={onDone}
					className="h-11.5 w-full rounded-[11px] font-semibold text-[14.5px] text-mute hover:bg-surface-warm hover:text-body"
				>
					Ahora no
				</Button>
			</div>
			{message && (
				<p role="alert" className="mt-4 text-[12.5px] text-danger">
					{message}
				</p>
			)}
		</div>
	);
}
