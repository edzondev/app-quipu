"use client";

import { useMutation } from "convex/react";
import { useTheme } from "next-themes";
import type { MouseEvent } from "react";
import { api } from "@/convex/_generated/api";
import { themeChangeTransition } from "@/shared/lib/theme-transition";
import { useIsClient } from "@/shared/lib/use-is-client";
import { cn } from "@/shared/lib/utils";
import { SETTINGS_THEME_DARK, SETTINGS_THEME_LABEL, SETTINGS_THEME_LIGHT } from "../constants";

export function SettingsThemeToggle() {
	const { resolvedTheme, setTheme } = useTheme();
	const updateAppearance = useMutation(api.progress.updateAppearance);
	const isClient = useIsClient();

	// SSR / first paint: defaultTheme is light, so treat as light until client.
	const isDark = isClient && resolvedTheme === "dark";

	async function applyTheme(next: "light" | "dark", origin?: { x: number; y: number }) {
		themeChangeTransition(() => setTheme(next), origin);
		try {
			await updateAppearance({
				appearanceTheme: next === "dark" ? "tinta" : "light",
			});
		} catch {
			// Preferencia local ya aplicada; la sync remota puede fallar offline.
		}
	}

	return (
		<div className="flex items-center justify-between gap-3 py-2.5">
			<span className="text-sm text-ink">{SETTINGS_THEME_LABEL}</span>
			<fieldset className="flex gap-1.5 border-0 p-0">
				<legend className="sr-only">{SETTINGS_THEME_LABEL}</legend>
				<button
					type="button"
					aria-pressed={!isDark}
					aria-label={SETTINGS_THEME_LIGHT}
					disabled={!isClient}
					onClick={(e: MouseEvent<HTMLButtonElement>) =>
						void applyTheme("light", { x: e.clientX, y: e.clientY })
					}
					className={cn(
						"h-[30px] w-11 rounded-lg border transition-colors",
						"bg-[#FBFAF7]",
						!isDark ? "border-ink ring-2 ring-ink/15" : "border-line",
					)}
				/>
				<button
					type="button"
					aria-pressed={isDark}
					aria-label={SETTINGS_THEME_DARK}
					disabled={!isClient}
					onClick={(e: MouseEvent<HTMLButtonElement>) =>
						void applyTheme("dark", { x: e.clientX, y: e.clientY })
					}
					className={cn(
						"h-[30px] w-11 rounded-lg border transition-colors",
						"bg-[#23201C]",
						isDark ? "border-ink ring-2 ring-ink/20" : "border-line",
					)}
				/>
			</fieldset>
		</div>
	);
}
