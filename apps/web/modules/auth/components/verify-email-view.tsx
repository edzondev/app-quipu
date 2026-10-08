"use client";

import Link from "next/link";
import { QuipuLogo } from "@/shared/components/quipu-logo";

export function VerifyEmailView() {
	return (
		<div className="mx-auto flex min-h-svh max-w-md flex-col justify-center px-6 py-10 text-center">
			<QuipuLogo />
			<h1 className="mt-8 font-serif text-2xl text-ink">Confirma tu correo</h1>
			<p className="mt-3 text-sm leading-relaxed text-mute">
				Te enviamos un enlace de verificación. Ábrelo en este dispositivo para activar el acceso con
				contraseña. Mientras tanto, puedes entrar con passkey si ya la configuraste.
			</p>
			<Link href="/sign-in" className="mt-8 text-sm font-medium text-qp-deep hover:underline">
				Ir a iniciar sesión
			</Link>
		</div>
	);
}
