"use client";

import { useMutation } from "convex/react";
import { useTheme } from "next-themes";
import type { MouseEvent } from "react";
import { Moon } from "reicon-react/icons/Moon";
import { Sun } from "reicon-react/icons/Sun";
import { api } from "@/convex/_generated/api";
import { Button } from "@/shared/components/ui/button";
import { themeChangeTransition } from "@/shared/lib/theme-transition";
import { useIsClient } from "@/shared/lib/use-is-client";
import { cn } from "@/shared/lib/utils";

type Props = {
	className?: string;
};

/** Toggle de tema sutil y siempre disponible en la app. */
export function ThemeToggleButton({ className }: Props) {
	const { resolvedTheme, setTheme } = useTheme();
	const updateAppearance = useMutation(api.progress.updateAppearance);
	const isClient = useIsClient();

	// SSR / first paint: defaultTheme is light, so treat as light until client.
	const isDark = isClient && resolvedTheme === "dark";
	const Icon = isDark ? Sun : Moon;

	function toggle(event: MouseEvent<HTMLButtonElement>) {
		const next = isDark ? "light" : "dark";
		themeChangeTransition(() => setTheme(next), {
			x: event.clientX,
			y: event.clientY,
		});
		updateAppearance({
			appearanceTheme: next === "dark" ? "tinta" : "light",
		}).catch(() => {
			// Preferencia local ya aplicada; la sync remota puede fallar offline.
		});
	}

	return (
		<Button
			type="button"
			variant="ghost"
			size="icon-sm"
			disabled={!isClient}
			aria-label={isDark ? "Cambiar a modo claro" : "Cambiar a modo oscuro"}
			aria-pressed={isDark}
			onClick={toggle}
			className={cn("text-ink-secondary", className)}
		>
			<Icon size={18} color="currentColor" aria-hidden />
		</Button>
	);
}
