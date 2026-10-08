import { v } from "convex/values";
import { components } from "../_generated/api";
import type { Id } from "../_generated/dataModel";
import {
	internalMutation,
	internalQuery,
	type MutationCtx,
	type QueryCtx,
} from "../_generated/server";
import { highestSeverity, scanTextsForContentFlags } from "../lib/contentFlags";
import { extractEmailDomain, isBlockedEmailDomain } from "../lib/email/domainPolicy";

const profileSummaryValidator = v.object({
	_id: v.id("profiles"),
	userId: v.string(),
	name: v.string(),
	country: v.string(),
	currencyCode: v.string(),
	incomeModel: v.union(v.literal("fixed"), v.literal("variable"), v.literal("mixed")),
	variableIncomeSources: v.optional(v.array(v.string())),
	plan: v.union(v.literal("free"), v.literal("premium")),
	accountStatus: v.optional(
		v.union(v.literal("active"), v.literal("suspended"), v.literal("under_review")),
	),
	createdAt: v.number(),
});

const investigationBundleValidator = v.object({
	profile: profileSummaryValidator,
	authUser: v.union(
		v.object({
			email: v.string(),
			emailVerified: v.boolean(),
			createdAt: v.number(),
		}),
		v.null(),
	),
	stats: v.object({
		incomeEventCount: v.number(),
		totalIncomeCents: v.number(),
		cycleCount: v.number(),
		fixedExpenseCount: v.number(),
		openFlags: v.number(),
	}),
	recentIncomeDescriptions: v.array(
		v.object({
			amount: v.number(),
			source: v.string(),
			description: v.string(),
			occurredAt: v.number(),
		}),
	),
	contentFlags: v.array(
		v.object({
			term: v.string(),
			snippet: v.string(),
			severity: v.union(v.literal("low"), v.literal("medium"), v.literal("high")),
		}),
	),
	emailDomainBlocked: v.boolean(),
});

async function buildInvestigationBundleForProfile(ctx: QueryCtx, profileId: Id<"profiles">) {
	const profile = await ctx.db.get("profiles", profileId);
	if (!profile) {
		throw new Error("Profile not found");
	}

	const [incomeEvents, cycles, fixedCommitments, openFlags, authUserRecord] = await Promise.all([
		ctx.db
			.query("incomeEvents")
			.withIndex("by_profile_time", (q) => q.eq("profileId", profileId))
			.order("desc")
			.take(25),
		ctx.db
			.query("financialCycles")
			.withIndex("by_profile_status", (q) => q.eq("profileId", profileId))
			.collect(),
		ctx.db
			.query("fixedCommitments")
			.withIndex("by_profileId", (q) => q.eq("profileId", profileId))
			.collect(),
		ctx.db
			.query("accountReviewFlags")
			.withIndex("by_status", (q) => q.eq("status", "open"))
			.collect(),
		ctx.runQuery(components.betterAuth.adapter.findOne, {
			model: "user",
			where: [{ field: "_id", operator: "eq", value: profile.userId }],
		}),
	]);

	const authUser =
		authUserRecord && typeof authUserRecord === "object" && "email" in authUserRecord
			? {
					email: String(authUserRecord.email),
					emailVerified: Boolean(authUserRecord.emailVerified),
					createdAt: Number(authUserRecord.createdAt),
				}
			: null;

	const flagTexts = [
		...incomeEvents.map((event) => event.description),
		...(profile.variableIncomeSources ?? []),
	];
	const contentFlags = scanTextsForContentFlags(flagTexts);

	const emailDomain = authUser ? extractEmailDomain(authUser.email) : "";

	return {
		profile: {
			_id: profile._id,
			userId: profile.userId,
			name: profile.name,
			country: profile.country,
			currencyCode: profile.currencyCode,
			incomeModel: profile.incomeModel,
			variableIncomeSources: profile.variableIncomeSources,
			plan: profile.plan,
			accountStatus: profile.accountStatus,
			createdAt: profile.createdAt,
		},
		authUser,
		stats: {
			incomeEventCount: incomeEvents.length,
			totalIncomeCents: incomeEvents.reduce((sum, event) => sum + event.amount, 0),
			cycleCount: cycles.length,
			fixedExpenseCount: fixedCommitments.length,
			openFlags: openFlags.filter((flag) => flag.profileId === profile._id).length,
		},
		recentIncomeDescriptions: incomeEvents.map((event) => ({
			amount: event.amount,
			source: event.source,
			description: event.description,
			occurredAt: event.occurredAt,
		})),
		contentFlags,
		emailDomainBlocked: emailDomain ? isBlockedEmailDomain(emailDomain) : false,
	};
}

export const buildInvestigationBundle = internalQuery({
	args: { profileId: v.id("profiles") },
	returns: investigationBundleValidator,
	handler: async (ctx, args) => buildInvestigationBundleForProfile(ctx, args.profileId),
});

/** @deprecated Prefer `buildInvestigationBundle` (I5 — internal only). */
export const getProfileInvestigationBundle = internalQuery({
	args: { profileId: v.id("profiles") },
	returns: investigationBundleValidator,
	handler: async (ctx, args) => buildInvestigationBundleForProfile(ctx, args.profileId),
});

export const enqueueManualReviewFlag = internalMutation({
	args: {
		profileId: v.id("profiles"),
		reason: v.union(
			v.literal("content"),
			v.literal("email"),
			v.literal("manual"),
			v.literal("volume"),
		),
		snippet: v.optional(v.string()),
		severity: v.union(v.literal("low"), v.literal("medium"), v.literal("high")),
	},
	returns: v.id("accountReviewFlags"),
	handler: async (ctx, args) => {
		return await ctx.db.insert("accountReviewFlags", {
			profileId: args.profileId,
			reason: args.reason,
			severity: args.severity,
			snippet: args.snippet,
			status: "open",
			createdAt: Date.now(),
		});
	},
});

export async function maybeFlagProfileFromTexts(
	ctx: Pick<MutationCtx, "db">,
	profileId: Id<"profiles">,
	texts: Array<string | undefined | null>,
	reason: "content" | "volume" = "content",
): Promise<void> {
	const matches = scanTextsForContentFlags(texts);
	const severity = highestSeverity(matches);
	if (!severity) return;

	await ctx.db.insert("accountReviewFlags", {
		profileId,
		reason,
		severity,
		snippet: matches[0]?.snippet.slice(0, 200),
		status: "open",
		createdAt: Date.now(),
	});
}
