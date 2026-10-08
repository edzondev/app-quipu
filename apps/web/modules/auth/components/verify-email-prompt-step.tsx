import Link from "next/link";
import { ChatDots } from "reicon-react/icons/ChatDots";
import { cn } from "@/shared/lib/utils";
import { authPrimaryButtonClass } from "../constants";
import { appendAuthReturnTo } from "../lib/auth-return-to";

type Props = {
	email: string;
	returnTo?: string;
};

/** Post sign-up cuando `requireEmailVerification` está activo (D1). */
export function VerifyEmailPromptStep({ email, returnTo }: Props) {
	return (
		<div className="flex w-full max-w-95 flex-col items-center text-center">
			<div className="mb-7 flex size-[88px] items-center justify-center rounded-full bg-qp-soft">
				<ChatDots size={36} color="var(--qp-deep)" aria-hidden />
			</div>
			<h1 className="font-serif font-medium text-[29px] text-ink">Revisa tu correo</h1>
			<p className="mt-2.5 max-w-[380px] text-[15px] leading-[1.55] text-mute">
				Enviamos un enlace de confirmación a <span className="font-medium text-body">{email}</span>.
				Confírmalo para entrar con contraseña. Passkey sigue disponible en iniciar sesión.
			</p>
			<Link
				href={appendAuthReturnTo(
					`/sign-in?email=${encodeURIComponent(email)}&reason=verify`,
					returnTo,
				)}
				className={cn(
					authPrimaryButtonClass,
					"mt-8 inline-flex h-[46px] items-center justify-center px-8",
				)}
			>
				Ir a iniciar sesión
			</Link>
			<p className="mt-4 text-[12.5px] text-faint">
				¿No llegó? Revisa spam o vuelve a intentar al iniciar sesión; te reenviamos el enlace.
			</p>
		</div>
	);
}
