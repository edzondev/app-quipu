import { ConvexError, v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { isDevelopmentDeployment } from "./lib/deployment";
import { assertAccountActive } from "./lib/entitlements";

/**
 * SOLO E2E: eleva/degrada el plan del usuario autenticado.
 *
 * Existe porque los smoke tests del rescate premium (`smoke.p0.spec.ts`) no
 * pueden pasar por el flujo real de facturación (Polar, pendiente). El guard
 * de deployment la hace inejecutable en producción. Acepta `dev:` y
 * `anonymous:` (Cloud Agent) vía `isDevelopmentDeployment()`.
 */
export const setMyPlan = mutation({
	args: { plan: v.union(v.literal("free"), v.literal("premium")) },
	handler: async (ctx, args) => {
		if (!isDevelopmentDeployment()) {
			throw new ConvexError({
				code: "FORBIDDEN",
				message: "Solo disponible en entornos de desarrollo.",
			});
		}

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

		await ctx.db.patch(profile._id, { plan: args.plan });
		return { success: true };
	},
});

/**
 * SOLO DEBUG: estado del coach del usuario autenticado (plan, interacciones
 * recientes, presentación). Guard de deployment igual que setMyPlan.
 */
export const debugMyCoachState = query({
	args: {},
	handler: async (ctx) => {
		if (!isDevelopmentDeployment()) {
			throw new ConvexError({
				code: "FORBIDDEN",
				message: "Solo disponible en entornos de desarrollo.",
			});
		}

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

		const recentInteractions = await ctx.db
			.query("coachInteractions")
			.withIndex("by_profile_status", (q) => q.eq("profileId", profile._id))
			.order("desc")
			.take(5);

		return {
			plan: profile.plan,
			profileId: profile._id,
			interactions: recentInteractions.map((i) => ({
				_id: i._id,
				triggerEvent: i.triggerEvent,
				status: i.status,
				selectedOptionId: i.selectedOptionId,
				initialNudgePrefix: i.initialNudge.slice(0, 80),
				hasRescueSuggestion: i.rescueSuggestion !== undefined,
				createdAt: i.createdAt,
			})),
		};
	},
});
