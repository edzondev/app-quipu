import Link from "next/link";
import { PLUS_UPSELL_LINK } from "@/shared/constants/plan";
import { cn } from "@/shared/lib/utils";

type Props = {
	/** Una línea: qué desbloquea Plus en este contexto. */
	message: string;
	/** Etiqueta de sección (p. ej. «Predicción»). */
	eyebrow?: string;
	href?: string;
	ctaLabel?: string;
	className?: string;
};

/**
 * Upsell compacto (Notion/Linear): fila mínima, enlace ghost a plan.
 * Dashboard y hints contextuales; paywalls explícitos siguen en PremiumLockCard.
 */
export function PremiumUpsellNudge({
	message,
	eyebrow,
	href = "/settings#plan",
	ctaLabel = PLUS_UPSELL_LINK,
	className,
}: Props) {
	const label = eyebrow ? `${eyebrow} — ${ctaLabel}` : ctaLabel;

	return (
		<section
			aria-label={label}
			className={cn(
				"flex flex-wrap items-center gap-x-3 gap-y-1 rounded-[11px] border border-dashed border-line px-3 py-2",
				className,
			)}
		>
			<div className="min-w-0 flex-1">
				{eyebrow ? (
					<p className="font-mono text-[10px] uppercase tracking-[0.1em] text-faint">{eyebrow}</p>
				) : null}
				<p className={cn("text-[12.5px] leading-snug text-mute", eyebrow && "mt-0.5")}>{message}</p>
			</div>
			<Link
				href={href}
				className="shrink-0 text-[12px] font-medium text-qp-deep underline-offset-2 transition-colors hover:text-qp hover:underline"
			>
				{ctaLabel}
			</Link>
		</section>
	);
}
