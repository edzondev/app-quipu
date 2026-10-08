"use client";

import { useQuery } from "convex/react";
import { useTheme } from "next-themes";
import { useEffect, useRef } from "react";
import { api } from "@/convex/_generated/api";

const THEME_STORAGE_KEY = "theme";

/**
 * Locks product accent to moss (no accent/icon picker) and seeds next-themes
 * from the profile only when the browser has no stored theme yet.
 */
export function AppearanceSync() {
	const appearance = useQuery(api.progress.getAppearance, {});
	const { setTheme } = useTheme();
	const hydratedFromProfile = useRef(false);

	useEffect(() => {
		const root = document.documentElement;
		root.dataset.accent = "moss";
		root.removeAttribute("data-app-icon");
	}, []);

	useEffect(() => {
		if (!appearance || hydratedFromProfile.current) return;
		hydratedFromProfile.current = true;

		try {
			if (window.localStorage.getItem(THEME_STORAGE_KEY)) return;
		} catch {
			// private mode / blocked storage — fall through to profile seed
		}

		setTheme(appearance.theme === "tinta" ? "dark" : "light");
	}, [appearance, setTheme]);

	return null;
}
