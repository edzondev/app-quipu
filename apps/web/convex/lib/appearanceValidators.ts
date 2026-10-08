import { type Infer, v } from "convex/values";

export const appearanceThemeValidator = v.union(v.literal("light"), v.literal("tinta"));

export type AppearanceTheme = Infer<typeof appearanceThemeValidator>;

export const accentPresetValidator = v.union(
	v.literal("moss"),
	v.literal("steel"),
	v.literal("clay"),
);

export type AccentPreset = Infer<typeof accentPresetValidator>;

export const appIconVariantValidator = v.union(v.literal("light"), v.literal("dark"));
