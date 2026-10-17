"use client";

import { useAction } from "convex/react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { api } from "@/convex/_generated/api";
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
	SETTINGS_DELETE_ACCOUNT_POLAR_BODY,
	SETTINGS_DELETE_ACCOUNT_POLAR_PORTAL,
	SETTINGS_DELETE_ACCOUNT_POLAR_TITLE,
	SETTINGS_DELETE_ACCOUNT_TITLE,
	SETTINGS_DELETE_ACCOUNT_WORKING,
	SETTINGS_PLAN_PREPARING,
} from "../constants";
import { deleteAccount } from "../lib/delete-account";

type Props = {
	className?: string;
	hasPassword?: boolean;
};

/**
 * D3 — "Eliminar cuenta". Modal destructivo del canon §3.6.5: border-top
 * terracota, salida siempre visible ("No, volver") y acción destructiva
 * deliberada. El borrado en cascada lo ejecuta el trigger onDelete del
 * backend (convex/auth.ts → profiles.deleteAllDataForProfile).
 *
 * No bloquea por el overview local: un premium sin Polar (p.ej. dado a
 * mano) aparece "active" y no tiene customer. Solo si beforeDelete
 * responde POLAR_SUBSCRIPTION_ACTIVE se muestra el portal. Web refresca
 * sesión con passkey, no con OTP.
 */
export function SettingsDeleteAccountItem({ className, hasPassword = true }: Props) {
	const router = useRouter();
	const passkeySupport = usePasskeySupport();
	const generatePortal = useAction(api.polar.generateCustomerPortalUrl);
	const [portalPending, startPortal] = useTransition();
	const [open, setOpen] = useState(false);
	const [isDeleting, setIsDeleting] = useState(false);
	const [password, setPassword] = useState("");
	const [errorMessage, setErrorMessage] = useState<string | null>(null);
	const [polarPortalRequired, setPolarPortalRequired] = useState(false);

	const resetLocalState = () => {
		setPassword("");
		setErrorMessage(null);
		setIsDeleting(false);
		setPolarPortalRequired(false);
	};

	const handleOpenChange = (next: boolean) => {
		setOpen(next);
		if (!next) resetLocalState();
	};

	const handleDelete = async () => {
		setIsDeleting(true);
		setErrorMessage(null);
		const result = await deleteAccount({
			password: hasPassword ? password : undefined,
			canUsePasskey: passkeySupport.webauthn,
		}).finally(() => {
			setIsDeleting(false);
		});
		if (!result.ok) {
			if (result.code === "POLAR_SUBSCRIPTION_ACTIVE") {
				setPolarPortalRequired(true);
				return;
			}
			setErrorMessage(result.message || SETTINGS_DELETE_ACCOUNT_ERROR);
			return;
		}
		router.push("/");
		router.refresh();
	};

	const handleOpenPortal = () => {
		startPortal(async () => {
			try {
				const { url } = await generatePortal({
					returnUrl: `${window.location.origin}/settings#plan`,
				});
				window.open(url, "_blank", "noopener,noreferrer");
			} catch {
				setErrorMessage(SETTINGS_DELETE_ACCOUNT_ERROR);
			}
		});
	};

	return (
		<>
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
							{polarPortalRequired
								? SETTINGS_DELETE_ACCOUNT_POLAR_TITLE
								: SETTINGS_DELETE_ACCOUNT_TITLE}
						</AlertDialogTitle>
						<AlertDialogDescription>
							{polarPortalRequired
								? SETTINGS_DELETE_ACCOUNT_POLAR_BODY
								: SETTINGS_DELETE_ACCOUNT_BODY}
						</AlertDialogDescription>
					</AlertDialogHeader>
					{hasPassword ? (
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
					) : null}
					{errorMessage ? (
						<p className="text-center text-[12.5px] text-danger-ink" role="alert">
							{errorMessage}
						</p>
					) : null}
					<AlertDialogFooter>
						<AlertDialogCancel disabled={isDeleting || portalPending}>
							{SETTINGS_DELETE_ACCOUNT_CANCEL}
						</AlertDialogCancel>
						{polarPortalRequired ? (
							<Button
								onClick={handleOpenPortal}
								disabled={portalPending}
								className="bg-ink text-canvas hover:bg-ink/90"
							>
								{portalPending ? SETTINGS_PLAN_PREPARING : SETTINGS_DELETE_ACCOUNT_POLAR_PORTAL}
							</Button>
						) : null}
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
