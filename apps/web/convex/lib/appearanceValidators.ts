import { v } from "convex/values";

export const appearanceThemeValidator = v.union(v.literal("light"), v.literal("tinta"));

export const accentPresetValidator = v.union(
	v.literal("moss"),
	v.literal("steel"),
	v.literal("clay"),
);

export const appIconVariantValidator = v.union(v.literal("light"), v.literal("dark"));
