import { ConvexError } from "convex/values";
import type { Doc } from "../_generated/dataModel";
import type { QueryCtx } from "../_generated/server";

/**
 * Suspended accounts must not use user-facing APIs.
 * `under_review` remains usable (soft flag); only `suspended` blocks.
 */
export function assertAccountActive(profile: Doc<"profiles">): void {
	if (profile.accountStatus === "suspended") {
		throw new ConvexError({
			code: "ACCOUNT_SUSPENDED",
			message: "Tu cuenta está suspendida. Contacta a soporte si crees que es un error.",
		});
	}
}

/**
 * I6 — puerta canónica: autenticado + perfil + cuenta no suspendida.
 */
export async function requireActiveAccount(ctx: QueryCtx): Promise<Doc<"profiles">> {
	const identity = await ctx.auth.getUserIdentity();
	if (!identity) {
		throw new ConvexError({
			code: "UNAUTHORIZED",
			message: "Debes iniciar sesión.",
		});
	}

	const profile = await ctx.db
		.query("profiles")
		.withIndex("by_userId", (q) => q.eq("userId", identity.subject))
		.unique();
	if (!profile) {
		throw new ConvexError({
			code: "NOT_FOUND",
			message: "Perfil no encontrado.",
		});
	}

	assertAccountActive(profile);
	return profile;
}

/** @deprecated Prefer `requireActiveAccount` (I6). */
export async function requireAuthenticatedProfile(ctx: QueryCtx): Promise<Doc<"profiles">> {
	return requireActiveAccount(ctx);
}

/**
 * Gate premium (Fase 0 — entitlements).
 *
 * Toda query/mutation que entregue valor exclusivo de Quipu Plus empieza
 * aquí: resuelve el perfil del usuario autenticado y exige plan premium.
 * El cliente discrimina por `error.code === "PLAN_REQUIRED"` para mostrar
 * el paywall (`shared/components/premium-lock-card.tsx`), nunca compara
 * mensajes.
 *
 * Funciona también desde mutations (`MutationCtx` es compatible con
 * `QueryCtx` para lectura).
 */
export async function requirePremiumProfile(ctx: QueryCtx): Promise<Doc<"profiles">> {
	const profile = await requireActiveAccount(ctx);

	if (profile.plan !== "premium") {
		throw new ConvexError({
			code: "PLAN_REQUIRED",
			message: "Esta función es parte de Quipu Plus.",
		});
	}

	return profile;
}
