import { ConvexError, v } from "convex/values";
import { marketFromCurrencyCode } from "../shared/constants/markets";
import { mutation, query } from "./_generated/server";
import {
	assertInviteeCurrencyCompatible,
	countActiveSpaceMembers,
	hashInvitationToken,
	requireSpaceOwner,
	requireSpaceWritable,
	SPACE_INVITATION_TTL_MS,
} from "./lib/spaceAuth";
import { hasMemberCapacity } from "./lib/spaceAuthLogic";

function generateToken(): string {
	const bytes = new Uint8Array(32);
	crypto.getRandomValues(bytes);
	return Array.from(bytes)
		.map((b) => b.toString(16).padStart(2, "0"))
		.join("");
}

export const create = mutation({
	args: {
		spaceId: v.id("financialSpaces"),
		invitedEmail: v.optional(v.string()),
	},
	returns: v.object({ token: v.string(), expiresAt: v.number() }),
	handler: async (ctx, args) => {
		const { profile } = await requireSpaceOwner(ctx, args.spaceId);
		await requireSpaceWritable(ctx, args.spaceId);

		const pending = await ctx.db
			.query("spaceInvitations")
			.withIndex("by_space_status", (q) => q.eq("spaceId", args.spaceId).eq("status", "pending"))
			.collect();
		if (pending.length >= 1) {
			throw new ConvexError({
				code: "ALREADY_EXISTS",
				message: "Ya hay una invitación pendiente para este espacio.",
			});
		}

		const activeCount = await countActiveSpaceMembers(ctx, args.spaceId);
		if (!hasMemberCapacity(activeCount)) {
			throw new ConvexError({
				code: "SPACE_MEMBER_LIMIT",
				message: "Este espacio ya tiene dos miembros activos.",
			});
		}

		const token = generateToken();
		const tokenHash = await hashInvitationToken(token);
		const now = Date.now();
		const expiresAt = now + SPACE_INVITATION_TTL_MS;

		await ctx.db.insert("spaceInvitations", {
			spaceId: args.spaceId,
			tokenHash,
			invitedEmail: args.invitedEmail,
			status: "pending",
			expiresAt,
			createdByProfileId: profile._id,
			createdAt: now,
		});

		return { token, expiresAt };
	},
});

export const previewByToken = query({
	args: { token: v.string() },
	returns: v.union(
		v.null(),
		v.object({
			spaceName: v.string(),
			inviterName: v.string(),
			currencyCode: v.string(),
			currencySymbol: v.string(),
			expiresAt: v.number(),
		}),
	),
	handler: async (ctx, args) => {
		const identity = await ctx.auth.getUserIdentity();
		if (!identity) return null;

		const tokenHash = await hashInvitationToken(args.token);
		const invitation = await ctx.db
			.query("spaceInvitations")
			.withIndex("by_tokenHash", (q) => q.eq("tokenHash", tokenHash))
			.unique();
		if (invitation?.status !== "pending") return null;
		if (invitation.expiresAt < Date.now()) return null;

		const space = await ctx.db.get("financialSpaces", invitation.spaceId);
		if (space?.status !== "active") return null;

		const activeCount = await countActiveSpaceMembers(ctx, space._id);
		if (!hasMemberCapacity(activeCount)) return null;

		const inviter = await ctx.db.get("profiles", invitation.createdByProfileId);
		return {
			spaceName: space.name,
			inviterName: inviter?.name ?? "Alguien",
			currencyCode: space.currencyCode,
			currencySymbol: space.currencySymbol,
			expiresAt: invitation.expiresAt,
		};
	},
});

export const accept = mutation({
	args: { token: v.string() },
	returns: v.id("financialSpaces"),
	handler: async (ctx, args) => {
		const identity = await ctx.auth.getUserIdentity();
		if (!identity) {
			throw new ConvexError({
				code: "UNAUTHORIZED",
				message: "Debes iniciar sesión.",
			});
		}

		const tokenHash = await hashInvitationToken(args.token);
		const invitation = await ctx.db
			.query("spaceInvitations")
			.withIndex("by_tokenHash", (q) => q.eq("tokenHash", tokenHash))
			.unique();
		if (invitation?.status !== "pending") {
			throw new ConvexError({
				code: "NOT_FOUND",
				message: "Invitación no válida.",
			});
		}
		if (invitation.expiresAt < Date.now()) {
			await ctx.db.patch(invitation._id, { status: "expired" });
			throw new ConvexError({
				code: "VALIDATION_ERROR",
				message: "Esta invitación expiró.",
			});
		}

		const space = await ctx.db.get("financialSpaces", invitation.spaceId);
		if (space?.status !== "active") {
			throw new ConvexError({
				code: "SPACE_READONLY",
				message: "Este espacio ya no acepta miembros.",
			});
		}

		const activeCount = await countActiveSpaceMembers(ctx, space._id);
		if (!hasMemberCapacity(activeCount)) {
			await ctx.db.patch(invitation._id, { status: "revoked" });
			throw new ConvexError({
				code: "SPACE_MEMBER_LIMIT",
				message: "Este espacio ya está completo.",
			});
		}

		let profile = await ctx.db
			.query("profiles")
			.withIndex("by_userId", (q) => q.eq("userId", identity.subject))
			.unique();

		if (!profile) {
			const market = marketFromCurrencyCode(space.currencyCode);
			if (!market) {
				throw new ConvexError({
					code: "VALIDATION_ERROR",
					message: "Moneda del espacio no soportada.",
				});
			}
			const name = (identity.name ?? identity.email ?? "Miembro").trim();
			const profileId = await ctx.db.insert("profiles", {
				userId: identity.subject,
				name: name || "Miembro",
				country: market.country,
				currencyCode: market.currencyCode,
				currencySymbol: market.currencySymbol,
				incomeModel: "variable",
				allocationNeeds: space.allocationNeeds,
				allocationWants: space.allocationWants,
				allocationSavings: space.allocationSavings,
				onboardingComplete: false,
				plan: "free",
				appearanceTheme: "light",
				accentPreset: "moss",
				appIconVariant: "light",
				dailySummaryEnabled: true,
				cycleAlertsEnabled: true,
				createdAt: Date.now(),
			});
			profile = await ctx.db.get("profiles", profileId);
			if (!profile) {
				throw new ConvexError({
					code: "INTERNAL_ERROR",
					message: "No se pudo crear el perfil.",
				});
			}
		} else {
			assertInviteeCurrencyCompatible(profile, space);
		}

		const existingMembership = await ctx.db
			.query("spaceMembers")
			.withIndex("by_space_profile", (q) => q.eq("spaceId", space._id).eq("profileId", profile._id))
			.unique();
		if (existingMembership?.status === "active") {
			throw new ConvexError({
				code: "ALREADY_EXISTS",
				message: "Ya eres miembro de este espacio.",
			});
		}

		const now = Date.now();
		if (existingMembership) {
			await ctx.db.patch(existingMembership._id, {
				status: "active",
				role: "member",
				joinedAt: now,
				leftAt: undefined,
			});
		} else {
			await ctx.db.insert("spaceMembers", {
				spaceId: space._id,
				profileId: profile._id,
				role: "member",
				status: "active",
				expectedContributionCents: 0,
				joinedAt: now,
			});
		}

		await ctx.db.patch(invitation._id, {
			status: "accepted",
			acceptedByProfileId: profile._id,
		});

		const remainingPending = await ctx.db
			.query("spaceInvitations")
			.withIndex("by_space_status", (q) => q.eq("spaceId", space._id).eq("status", "pending"))
			.collect();
		await Promise.all(
			remainingPending.map((pendingInvite) =>
				ctx.db.patch(pendingInvite._id, { status: "revoked" }),
			),
		);

		return space._id;
	},
});

export const revoke = mutation({
	args: { invitationId: v.id("spaceInvitations") },
	returns: v.null(),
	handler: async (ctx, args) => {
		const invitation = await ctx.db.get("spaceInvitations", args.invitationId);
		if (!invitation) {
			throw new ConvexError({
				code: "NOT_FOUND",
				message: "Invitación no encontrada.",
			});
		}
		await requireSpaceOwner(ctx, invitation.spaceId);
		if (invitation.status !== "pending") {
			throw new ConvexError({
				code: "CONFLICT",
				message: "Esta invitación ya no está pendiente.",
			});
		}
		await ctx.db.patch(args.invitationId, { status: "revoked" });
		return null;
	},
});

export const listPendingForSpace = query({
	args: { spaceId: v.id("financialSpaces") },
	returns: v.array(
		v.object({
			_id: v.id("spaceInvitations"),
			expiresAt: v.number(),
			invitedEmail: v.optional(v.string()),
		}),
	),
	handler: async (ctx, args) => {
		await requireSpaceOwner(ctx, args.spaceId);
		const rows = await ctx.db
			.query("spaceInvitations")
			.withIndex("by_space_status", (q) => q.eq("spaceId", args.spaceId).eq("status", "pending"))
			.collect();
		return rows.map((row) => ({
			_id: row._id,
			expiresAt: row.expiresAt,
			invitedEmail: row.invitedEmail,
		}));
	},
});
