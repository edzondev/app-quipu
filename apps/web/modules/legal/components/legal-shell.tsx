import Link from "next/link";
import type { ReactNode } from "react";
import { QuipuLogo } from "@/shared/components/quipu-logo";

type Props = {
	title: string;
	updatedAt: string;
	children: ReactNode;
};

/** Shell público de páginas legales (/terminos, /privacidad). */
export function LegalShell({ title, updatedAt, children }: Props) {
	return (
		<div className="flex min-h-dvh flex-col bg-canvas px-6 py-7 sm:px-14">
			<header className="flex items-center justify-between">
				<Link href="/" aria-label="Volver al inicio de Quipu">
					<QuipuLogo />
				</Link>
				<Link href="/" className="text-[13px] text-mute hover:text-ink">
					Volver
				</Link>
			</header>

			<main className="mx-auto w-full max-w-2xl flex-1 py-10">
				<h1 className="font-serif text-[30px] font-medium text-ink">{title}</h1>
				<p className="mt-2 font-mono text-[10.5px] uppercase tracking-[0.1em] text-faint">
					Última actualización: {updatedAt}
				</p>
				<div className="mt-8 space-y-8 text-[14.5px] leading-relaxed text-body">{children}</div>
			</main>

			<footer className="flex flex-wrap justify-center gap-5 border-t border-line-soft pt-5 text-[12.5px] text-mute-subtle">
				<Link href="/terminos" className="hover:text-body">
					Términos
				</Link>
				<Link href="/privacidad" className="hover:text-body">
					Privacidad
				</Link>
				<a href="mailto:abuse@quipu-finance.app" className="hover:text-body">
					Reportar abuso
				</a>
			</footer>
		</div>
	);
}
