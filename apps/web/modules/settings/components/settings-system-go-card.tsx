import Link from "next/link";
import { ArrowRight } from "reicon-react/icons/ArrowRight";
import { cn } from "@/shared/lib/utils";
import { SETTINGS_SYSTEM_GO_LINK, SETTINGS_SYSTEM_PAGE_SUBTITLE } from "../constants";

type Props = {
	className?: string;
};

/** Affordance primaria hacia /settings/system — card, no link tenue. */
export function SettingsSystemGoCard({ className }: Props) {
	return (
		<Link
			href="/settings/system"
			className={cn(
				"flex min-h-11 items-center gap-3 rounded-xl border border-line/70 bg-card px-4 py-3.5 transition-colors",
				"hover:border-qp-border hover:bg-qp-soft/40",
				"focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-qp-tint/80 focus-visible:ring-offset-2 focus-visible:ring-offset-canvas",
				className,
			)}
		>
			<span className="min-w-0 flex-1">
				<span className="block font-serif text-[18px] font-medium leading-tight text-ink md:text-[20px]">
					{SETTINGS_SYSTEM_GO_LINK}
				</span>
				<span className="mt-0.5 block truncate text-[12.5px] leading-snug text-mute-subtle">
					{SETTINGS_SYSTEM_PAGE_SUBTITLE}
				</span>
			</span>
			<ArrowRight
				size={20}
				weight="Outline"
				color="currentColor"
				className="shrink-0 text-qp-deep"
				aria-hidden
			/>
		</Link>
	);
}
