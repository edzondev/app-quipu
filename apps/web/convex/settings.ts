import { ConvexError, v } from "convex/values";
import { currencyReadOnlyLabel } from "../shared/constants/markets";
import { plusMonthlyPriceLabel } from "../shared/constants/plan";
import { components } from "./_generated/api";
import type { QueryCtx } from "./_generated/server";
import { mutation, query } from "./_generated/server";
import { loadPolarSubscriptionForUser } from "./billing";
import { buildBillingOverview } from "./lib/billingSync";
import { isValidAllocations, isValidPaydays } from "./lib/budgetMath";
import {
	buildCycleScheduleCopy,
	formatActiveCycleRangeCopy,
	incomeModelLabel,
	planDisplay,
	resolveCycleAlertsEnabled,
	resolveDailySummaryEnabled,
} from "./lib/settingsCopy";
import { polarProductIds } from "./polar";

type PasskeyRecord = {
	id: string;
	name: string | null;
	deviceType: string;
	backedUp: boolean;
	createdAt: number | null;
};

type SessionSummary = {
	id: string;
	createdAt: number;
	userAgent: string | null;
};

async function loadSessionsForUser(
	ctx: QueryCtx,
	userId: string,
): Promise<{ sessions: SessionSummary[]; apiReady: boolean }> {
	try {
		const result = await ctx.runQuery(components.betterAuth.adapter.findMany, {
			model: "session",
			where: [{ field: "userId", operator: "eq", value: userId }],
			paginationOpts: { numItems: 50, cursor: null },
		});

		const page = (result as { page?: unknown[] }).page ?? [];
		const now = Date.now();
		const sessions = page
			.map((row) => {
				const doc = row as {
					_id?: string;
					id?: string;
					expiresAt?: number;
					createdAt?: number;
					userAgent?: string | null;
				};
				const id = doc._id ?? doc.id;
				if (!id || (doc.expiresAt ?? 0) <= now) return null;
				return {
					id: String(id),
					createdAt: doc.createdAt ?? 0,
					userAgent: doc.userAgent ?? null,
				};
			})
			.filter((row): row is SessionSummary => row !== null);

		return { sessions, apiReady: true };
	} catch {
		return { sessions: [], apiReady: false };
	}
}

async function loadPasskeysForUser(
	ctx: QueryCtx,
	userId: string,
): Promise<{
	passkeys: PasskeyRecord[];
	passkeysSource: "better_auth" | "unavailable";
}> {
	try {
		const result = await ctx.runQuery(components.betterAuth.adapter.findMany, {
			model: "passkey",
			where: [{ field: "userId", operator: "eq", value: userId }],
			paginationOpts: { numItems: 50, cursor: null },
		});

		const page = (result as { page?: unknown[] }).page ?? [];
		const passkeys = page
			.map((row) => {
				const doc = row as {
					_id?: string;
					id?: string;
					name?: string | null;
					deviceType?: string;
					backedUp?: boolean;
					createdAt?: number | null;
				};
				const id = doc._id ?? doc.id;
				if (!id) return null;
				return {
					id: String(id),
					name: doc.name ?? null,
					deviceType: doc.deviceType ?? "unknown",
					backedUp: doc.backedUp ?? false,
					createdAt: doc.createdAt ?? null,
				};
			})
			.filter((row): row is PasskeyRecord => row !== null);

		return { passkeys, passkeysSource: "better_auth" };
	} catch {
		return { passkeys: [], passkeysSource: "unavailable" };
	}
}

export const getSettingsOverview = query({
	args: {},
	handler: async (ctx) => {
		const identity = await ctx.auth.getUserIdentity();
		if (!identity) return null;

		const profile = await ctx.db
			.query("profiles")
			.withIndex("by_userId", (q) => q.eq("userId", identity.subject))
			.unique();
		if (!profile) return null;

		const [commitments, activeCycle, security, sessionsInfo] = await Promise.all([
			ctx.db
				.query("fixedCommitments")
				.withIndex("by_profileId", (q) => q.eq("profileId", profile._id))
				.collect(),
			ctx.db
				.query("financialCycles")
				.withIndex("by_profile_status", (q) =>
					q.eq("profileId", profile._id).eq("status", "active"),
				)
				.unique(),
			loadPasskeysForUser(ctx, identity.subject),
			loadSessionsForUser(ctx, identity.subject),
		]);

		const cycleSchedule = buildCycleScheduleCopy(profile);
		const tags: string[] = [];
		if (profile.variableIncomeSources?.length) {
			tags.push(...profile.variableIncomeSources.slice(0, 2));
		}
		tags.push(`Perfil ${incomeModelLabel(profile.incomeModel)}`);

		const totalCents = commitments.reduce((sum, c) => sum + c.amount, 0);

		const polarSnapshot = await loadPolarSubscriptionForUser(ctx, identity.subject);
		const billing = buildBillingOverview(
			polarSnapshot,
			{
				monthly: polarProductIds.plusMonthly,
				yearly: polarProductIds.plusYearly,
			},
			{
				freeBody: "Gratis. Registros manuales sin límite.",
				renewalPrefix: "Próxima renovación",
				renewalAutomatic: "Renovación automática",
				canceledUntil: "Cancelado · activo hasta",
			},
		);
		const displayPlan = planDisplay(billing.tier, profile.currencyCode);

		return {
			account: {
				name: profile.name,
				email: identity.email ?? null,
				country: profile.country,
				currencyCode: profile.currencyCode,
				currencySymbol: profile.currencySymbol,
				incomeModel: {
					value: profile.incomeModel,
					label: incomeModelLabel(profile.incomeModel),
				},
				tags,
				plan: displayPlan,
			},
			billing: {
				renewalSummary: billing.renewalSummary,
				subscriptionStatus: billing.subscriptionStatus,
				cancelAtPeriodEnd: billing.cancelAtPeriodEnd,
				checkoutAvailable: billing.checkoutAvailable,
				premiumProductId: billing.premiumProductId,
				plusProductIds: billing.plusProductIds,
				monthlyPriceLabel: plusMonthlyPriceLabel(profile.currencyCode),
			},
			allocations: {
				needs: profile.allocationNeeds,
				wants: profile.allocationWants,
				savings: profile.allocationSavings,
			},
			cycle: {
				...cycleSchedule,
				activeRangeCopy: activeCycle
					? formatActiveCycleRangeCopy(activeCycle.startDate, activeCycle.endDate)
					: null,
			},
			commitments: {
				items: commitments.map((c) => ({
					id: c._id,
					name: c.name,
					amount: c.amount,
					envelope: c.envelope,
					dueDay: c.dueDay,
				})),
				totalCents,
			},
			preferences: {
				dailySummaryEnabled: resolveDailySummaryEnabled(profile),
				cycleAlertsEnabled: resolveCycleAlertsEnabled(profile),
				currencyReadOnly: currencyReadOnlyLabel(profile.currencyCode, profile.currencySymbol),
				localeReadOnly: "Español",
			},
			security: {
				...security,
				sessions: {
					count: sessionsInfo.sessions.length,
					apiReady: sessionsInfo.apiReady,
				},
			},
		};
	},
});

export const listMyPasskeys = query({
	args: {},
	handler: async (ctx) => {
		const identity = await ctx.auth.getUserIdentity();
		if (!identity) return null;
		return loadPasskeysForUser(ctx, identity.subject);
	},
});

export const listMySessions = query({
	args: {},
	handler: async (ctx) => {
		const identity = await ctx.auth.getUserIdentity();
		if (!identity) return null;
		return loadSessionsForUser(ctx, identity.subject);
	},
});

export const revokeAllSessions = mutation({
	args: {},
	handler: async (ctx) => {
		const identity = await ctx.auth.getUserIdentity();
		if (!identity) {
			throw new ConvexError({
				code: "UNAUTHORIZED",
				message: "Debes iniciar sesión con tu Passkey o credencial.",
			});
		}

		try {
			await ctx.runMutation(components.betterAuth.adapter.deleteMany, {
				input: {
					model: "session",
					where: [{ field: "userId", operator: "eq", value: identity.subject }],
				},
				paginationOpts: { numItems: 999999, cursor: null },
			});
		} catch {
			throw new ConvexError({
				code: "INTERNAL_ERROR",
				message: "No pudimos cerrar las sesiones. Intenta de nuevo.",
			});
		}

		return { success: true };
	},
});

const payFrequencyValidator = v.union(
	v.literal("monthly"),
	v.literal("biweekly"),
	v.literal("weekly"),
	v.literal("variable"),
);

/** Cambia calendario de ciclo en perfil; el ciclo activo no se recalcula (§5.3 maestro). */
export const updateCycleSchedule = mutation({
	args: {
		payFrequency: v.optional(payFrequencyValidator),
		paydays: v.optional(v.array(v.number())),
		cycleDurationDays: v.optional(v.union(v.literal(15), v.literal(30))),
	},
	handler: async (ctx, args) => {
		const identity = await ctx.auth.getUserIdentity();
		if (!identity) {
			throw new ConvexError({
				code: "UNAUTHORIZED",
				message: "Debes iniciar sesión con tu Passkey o credencial.",
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

		const updates: {
			payFrequency?: typeof profile.payFrequency;
			paydays?: number[];
			cycleDurationDays?: number;
		} = {};

		if (profile.incomeModel === "variable") {
			if (args.payFrequency !== undefined || args.paydays !== undefined) {
				throw new ConvexError({
					code: "VALIDATION_ERROR",
					message: "Para ingreso variable solo puedes cambiar la duración del ciclo.",
				});
			}
			if (args.cycleDurationDays !== undefined) {
				updates.cycleDurationDays = args.cycleDurationDays;
			}
		} else {
			if (args.cycleDurationDays !== undefined) {
				throw new ConvexError({
					code: "VALIDATION_ERROR",
					message: "La duración en días solo aplica a ingreso variable.",
				});
			}
			const payFrequency = args.payFrequency ?? profile.payFrequency ?? "monthly";
			const paydays = args.paydays ?? profile.paydays ?? [];
			if (!isValidPaydays(payFrequency, paydays)) {
				throw new ConvexError({
					code: "VALIDATION_ERROR",
					message: "Los días de pago no son válidos para la frecuencia seleccionada.",
					data: { field: "paydays" },
				});
			}
			if (args.payFrequency !== undefined) updates.payFrequency = args.payFrequency;
			if (args.paydays !== undefined) updates.paydays = args.paydays;
		}

		if (Object.keys(updates).length === 0) {
			throw new ConvexError({
				code: "VALIDATION_ERROR",
				message: "No hay cambios para guardar.",
			});
		}

		await ctx.db.patch(profile._id, updates);
		return { success: true, appliesFrom: "next_cycle" as const };
	},
});

export const updateAllocations = mutation({
	args: {
		allocationNeeds: v.number(),
		allocationWants: v.number(),
		allocationSavings: v.number(),
	},
	handler: async (ctx, args) => {
		const identity = await ctx.auth.getUserIdentity();
		if (!identity) {
			throw new ConvexError({
				code: "UNAUTHORIZED",
				message: "Debes iniciar sesión con tu Passkey o credencial.",
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

		if (!isValidAllocations(args.allocationNeeds, args.allocationWants, args.allocationSavings)) {
			throw new ConvexError({
				code: "VALIDATION_ERROR",
				message: "Los porcentajes deben sumar exactamente 100% con valores enteros no negativos.",
			});
		}

		await ctx.db.patch(profile._id, {
			allocationNeeds: args.allocationNeeds,
			allocationWants: args.allocationWants,
			allocationSavings: args.allocationSavings,
		});

		return { success: true };
	},
});

const extraordinaryProfileRuleValidator = v.union(
	v.literal("all_to_emergency_fund"),
	v.literal("profile_default"),
	v.literal("all_to_savings"),
	v.literal("ask_each_time"),
);

const extraordinaryRulesAutoApplyValidator = v.object({
	cts: v.optional(v.boolean()),
	gratifications: v.optional(v.boolean()),
	corporate_bonus: v.optional(v.boolean()),
	profit_sharing: v.optional(v.boolean()),
	custom: v.optional(v.boolean()),
});

export const updateExtraordinaryRules = mutation({
	args: {
		extraordinaryRules: v.object({
			cts: extraordinaryProfileRuleValidator,
			gratifications: extraordinaryProfileRuleValidator,
			corporate_bonus: extraordinaryProfileRuleValidator,
			profit_sharing: extraordinaryProfileRuleValidator,
			custom: extraordinaryProfileRuleValidator,
		}),
		extraordinaryRulesAutoApply: v.optional(extraordinaryRulesAutoApplyValidator),
	},
	returns: v.object({ success: v.boolean() }),
	handler: async (ctx, args) => {
		const identity = await ctx.auth.getUserIdentity();
		if (!identity) {
			throw new ConvexError({
				code: "UNAUTHORIZED",
				message: "Debes iniciar sesión con tu Passkey o credencial.",
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

		// Auto-aplicación es Plus: free no puede activar flags en true.
		if (args.extraordinaryRulesAutoApply !== undefined && profile.plan !== "premium") {
			const enabling = Object.values(args.extraordinaryRulesAutoApply).some(
				(value) => value === true,
			);
			if (enabling) {
				throw new ConvexError({
					code: "PLAN_REQUIRED",
					message: "La auto-aplicación es parte de Quipu Plus.",
				});
			}
		}

		await ctx.db.patch(profile._id, {
			extraordinaryRules: args.extraordinaryRules,
			...(args.extraordinaryRulesAutoApply !== undefined && {
				extraordinaryRulesAutoApply: args.extraordinaryRulesAutoApply,
			}),
		});

		return { success: true };
	},
});

export const updateNotificationPreferences = mutation({
	args: {
		dailySummaryEnabled: v.optional(v.boolean()),
		cycleAlertsEnabled: v.optional(v.boolean()),
	},
	handler: async (ctx, args) => {
		const identity = await ctx.auth.getUserIdentity();
		if (!identity) {
			throw new ConvexError({
				code: "UNAUTHORIZED",
				message: "Debes iniciar sesión con tu Passkey o credencial.",
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

		if (args.dailySummaryEnabled === undefined && args.cycleAlertsEnabled === undefined) {
			throw new ConvexError({
				code: "VALIDATION_ERROR",
				message: "Indica al menos una preferencia para actualizar.",
			});
		}

		const updates: {
			dailySummaryEnabled?: boolean;
			cycleAlertsEnabled?: boolean;
		} = {};
		if (args.dailySummaryEnabled !== undefined) {
			updates.dailySummaryEnabled = args.dailySummaryEnabled;
		}
		if (args.cycleAlertsEnabled !== undefined) {
			updates.cycleAlertsEnabled = args.cycleAlertsEnabled;
		}

		await ctx.db.patch(profile._id, updates);

		return { success: true };
	},
});
