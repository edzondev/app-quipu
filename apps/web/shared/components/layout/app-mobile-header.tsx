"use client";

import { Menu } from "reicon-react/icons/Menu";
import { QuipuLogo } from "@/shared/components/quipu-logo";
import { ThemeToggleButton } from "@/shared/components/theme-toggle-button";
import { Button } from "@/shared/components/ui/button";
import { cn } from "@/shared/lib/utils";

type Props = {
	onMenuClick: () => void;
	className?: string;
};

export function AppMobileHeader({ onMenuClick, className }: Props) {
	return (
		<header
			className={cn(
				"flex items-center border-b border-line bg-canvas/95 px-4 py-3 backdrop-blur-md md:hidden",
				className,
			)}
		>
			<Button
				type="button"
				variant="outline"
				size="icon-sm"
				className="size-10 text-ink-secondary"
				aria-label="Abrir menú de navegación"
				onClick={onMenuClick}
			>
				<Menu size={22} color="currentColor" aria-hidden />
			</Button>
			<QuipuLogo className="scale-90 flex-1" />
			<ThemeToggleButton />
		</header>
	);
}
