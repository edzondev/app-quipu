import { ConvexError } from "convex/values";
import type { Doc, Id } from "../_generated/dataModel";
import type { MutationCtx, QueryCtx } from "../_generated/server";
import { requireActiveAccount } from "./entitlements";
import {
	assertCurrencyCompatible,
	isSpaceWritable,
	shouldTransitionSpaceToReadonly,
} from "./spaceAuthLogic";

type Ctx = QueryCtx | MutationCtx;

export async function getSpaceMember(
	ctx: Ctx,
	spaceId: Id<"financialSpaces">,
	profileId: Id<"profiles">,
): Promise<Doc<"spaceMembers"> | null> {
	return await ctx.db
		.query("spaceMembers")
		.withIndex("by_space_profile", (q) => q.eq("spaceId", spaceId).eq("profileId", profileId))
		.unique();
}

export async function requireSpaceMember(ctx: Ctx, spaceId: Id<"financialSpaces">) {
	const profile = await requireActiveAccount(ctx);
	const space = await ctx.db.get("financialSpaces", spaceId);
	if (!space) {
		throw new ConvexError({
			code: "NOT_FOUND",
			message: "Espacio no encontrado.",
		});
	}

	const membership = await getSpaceMember(ctx, spaceId, profile._id);
	if (membership?.status !== "active") {
		throw new ConvexError({
			code: "SPACE_NOT_MEMBER",
			message: "No eres miembro activo de este espacio.",
		});
	}

	const creator = await ctx.db.get("profiles", space.createdByProfileId);
	if (!creator) {
		throw new ConvexError({
			code: "NOT_FOUND",
			message: "Creador del espacio no encontrado.",
		});
	}

	return { profile, membership, space, creator };
}

export async function requireSpaceOwner(ctx: Ctx, spaceId: Id<"financialSpaces">) {
	const result = await requireSpaceMember(ctx, spaceId);
	if (result.membership.role !== "owner") {
		throw new ConvexError({
			code: "FORBIDDEN",
			message: "Solo el titular del espacio puede hacer esto.",
		});
	}
	return result;
}

export async function transitionSpaceToReadonlyIfNeeded(
	ctx: MutationCtx,
	space: Doc<"financialSpaces">,
	creatorProfile: Doc<"profiles">,
): Promise<Doc<"financialSpaces">> {
	if (!shouldTransitionSpaceToReadonly(space, creatorProfile)) {
		return space;
	}
	await ctx.db.patch(space._id, {
		status: "readonly",
		premiumExpiredAt: Date.now(),
	});
	return {
		...space,
		status: "readonly" as const,
		premiumExpiredAt: Date.now(),
	};
}

export async function requireSpaceWritable(ctx: MutationCtx, spaceId: Id<"financialSpaces">) {
	const result = await requireSpaceMember(ctx, spaceId);
	const syncedSpace = await transitionSpaceToReadonlyIfNeeded(ctx, result.space, result.creator);
	if (!isSpaceWritable(syncedSpace, result.creator)) {
		throw new ConvexError({
			code: "SPACE_READONLY",
			message:
				syncedSpace.status === "closed"
					? "Este espacio está cerrado."
					: "Este espacio está en solo lectura. Renueva Quipu Plus para editarlo.",
		});
	}
	return { ...result, space: syncedSpace };
}

export function assertInviteeCurrencyCompatible(
	inviteeProfile: Doc<"profiles">,
	space: Doc<"financialSpaces">,
): void {
	const check = assertCurrencyCompatible(inviteeProfile, space);
	if (!check.ok) {
		throw new ConvexError({
			code: "CURRENCY_MISMATCH",
			message:
				"Tu moneda personal no coincide con la del espacio. Configura la misma moneda antes de unirte.",
		});
	}
}

export async function countActiveSpaceMembers(
	ctx: Ctx,
	spaceId: Id<"financialSpaces">,
): Promise<number> {
	const members = await ctx.db
		.query("spaceMembers")
		.withIndex("by_space_status", (q) => q.eq("spaceId", spaceId).eq("status", "active"))
		.collect();
	return members.length;
}

export async function getActiveSpaceCycle(
	ctx: Ctx,
	spaceId: Id<"financialSpaces">,
): Promise<Doc<"spaceCycles"> | null> {
	return await ctx.db
		.query("spaceCycles")
		.withIndex("by_space_status", (q) => q.eq("spaceId", spaceId).eq("status", "active"))
		.unique();
}

export async function countOwnerSpaces(ctx: Ctx, profileId: Id<"profiles">): Promise<number> {
	const spaces = await ctx.db
		.query("financialSpaces")
		.withIndex("by_creator", (q) => q.eq("createdByProfileId", profileId))
		.collect();
	return spaces.filter((space) => space.status !== "closed").length;
}

export async function hashInvitationToken(token: string): Promise<string> {
	const hashBuffer = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(token));
	return Array.from(new Uint8Array(hashBuffer))
		.map((byte) => byte.toString(16).padStart(2, "0"))
		.join("");
}

export const SPACE_INVITATION_TTL_MS = 7 * 24 * 60 * 60 * 1000;
