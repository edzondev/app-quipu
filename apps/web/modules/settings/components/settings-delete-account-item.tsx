"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { usePasskeySupport } from "@/modules/auth/hooks/use-passkey-support";
import {
	AlertDialog,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
} from "@/shared/components/ui/alert-dialog";
import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";
import { cn } from "@/shared/lib/utils";
import {
	SETTINGS_DELETE_ACCOUNT,
	SETTINGS_DELETE_ACCOUNT_BODY,
	SETTINGS_DELETE_ACCOUNT_CANCEL,
	SETTINGS_DELETE_ACCOUNT_CONFIRM,
	SETTINGS_DELETE_ACCOUNT_ERROR,
	SETTINGS_DELETE_ACCOUNT_PASSWORD_LABEL,
	SETTINGS_DELETE_ACCOUNT_PASSWORD_PLACEHOLDER,
	SETTINGS_DELETE_ACCOUNT_TITLE,
	SETTINGS_DELETE_ACCOUNT_WORKING,
} from "../constants";
import { deleteAccount } from "../lib/delete-account";

type Props = {
	className?: string;
};

/**
 * D3 — "Eliminar cuenta". Modal destructivo del canon §3.6.5: border-top
 * terracota, salida siempre visible ("No, volver") y acción destructiva
 * deliberada. El borrado en cascada lo ejecuta el trigger onDelete del
 * backend (convex/auth.ts → profiles.deleteAllDataForProfile).
 *
 * Better Auth exige sesión fresh (<24h) o contraseña. Si la sesión es vieja
 * (común con passkey), reautenticamos con passkey y reintentamos.
 */
export function SettingsDeleteAccountItem({ className }: Props) {
	const router = useRouter();
	const passkeySupport = usePasskeySupport();
	const [open, setOpen] = useState(false);
	const [isDeleting, setIsDeleting] = useState(false);
	const [password, setPassword] = useState("");
	const [errorMessage, setErrorMessage] = useState<string | null>(null);

	const resetLocalState = () => {
		setPassword("");
		setErrorMessage(null);
		setIsDeleting(false);
	};

	const handleOpenChange = (next: boolean) => {
		setOpen(next);
		if (!next) resetLocalState();
	};

	const handleDelete = async () => {
		setIsDeleting(true);
		setErrorMessage(null);
		const result = await deleteAccount({
			password,
			canUsePasskey: passkeySupport.webauthn,
		}).finally(() => {
			setIsDeleting(false);
		});
		if (!result.ok) {
			setErrorMessage(result.message || SETTINGS_DELETE_ACCOUNT_ERROR);
			return;
		}
		router.push("/");
		router.refresh();
	};

	return (
		<>
			{/* Enlace discreto: la destructiva NO debe ser el CTA con más peso de la página. */}
			<button
				type="button"
				onClick={() => setOpen(true)}
				className={cn(
					"min-h-11 text-left text-[13px] font-medium text-danger-ink underline-offset-4 transition-colors hover:underline",
					className,
				)}
			>
				{SETTINGS_DELETE_ACCOUNT}
			</button>

			<AlertDialog open={open} onOpenChange={handleOpenChange}>
				<AlertDialogContent className="rounded-[22px] border-t-4 border-t-danger">
					<AlertDialogHeader>
						<AlertDialogTitle className="font-serif">
							{SETTINGS_DELETE_ACCOUNT_TITLE}
						</AlertDialogTitle>
						<AlertDialogDescription>{SETTINGS_DELETE_ACCOUNT_BODY}</AlertDialogDescription>
					</AlertDialogHeader>
					<div className="space-y-1.5">
						<label htmlFor="delete-account-password" className="text-[12.5px] text-mute">
							{SETTINGS_DELETE_ACCOUNT_PASSWORD_LABEL}
						</label>
						<Input
							id="delete-account-password"
							type="password"
							autoComplete="current-password"
							value={password}
							disabled={isDeleting}
							placeholder={SETTINGS_DELETE_ACCOUNT_PASSWORD_PLACEHOLDER}
							onChange={(event) => setPassword(event.target.value)}
							className="h-11 rounded-[11px]"
						/>
					</div>
					{errorMessage ? (
						<p className="text-center text-[12.5px] text-danger-ink" role="alert">
							{errorMessage}
						</p>
					) : null}
					<AlertDialogFooter>
						<AlertDialogCancel disabled={isDeleting}>
							{SETTINGS_DELETE_ACCOUNT_CANCEL}
						</AlertDialogCancel>
						<Button
							onClick={handleDelete}
							disabled={isDeleting}
							className="bg-danger text-canvas hover:bg-danger/90"
						>
							{isDeleting ? SETTINGS_DELETE_ACCOUNT_WORKING : SETTINGS_DELETE_ACCOUNT_CONFIRM}
						</Button>
					</AlertDialogFooter>
				</AlertDialogContent>
			</AlertDialog>
		</>
	);
}
