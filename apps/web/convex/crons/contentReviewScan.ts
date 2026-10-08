import { v } from "convex/values";
import { internalMutation } from "../_generated/server";
import { maybeFlagProfileFromTexts } from "../admin/investigation";
import { highestSeverity, scanTextsForContentFlags } from "../lib/contentFlags";

const CANDIDATE_BATCH = 50;

/**
 * I8 — procesa solo perfiles marcados como candidatos (`needsContentReview`).
 * El marcado ocurre al escribir textos de usuario (p. ej. ingresos).
 */
export const scanOpenProfilesForContentFlags = internalMutation({
	args: {},
	returns: v.object({
		profilesScanned: v.number(),
		flagsCreated: v.number(),
	}),
	handler: async (ctx) => {
		const [candidates, existingOpen] = await Promise.all([
			ctx.db
				.query("profiles")
				.withIndex("by_needsContentReview", (q) => q.eq("needsContentReview", true))
				.take(CANDIDATE_BATCH),
			ctx.db
				.query("accountReviewFlags")
				.withIndex("by_status", (q) => q.eq("status", "open"))
				.collect(),
		]);
		const flaggedProfileIds = new Set(
			existingOpen.flatMap((flag) => (flag.reason === "content" ? [flag.profileId] : [])),
		);

		const scanResults = await Promise.all(
			candidates.map(async (profile) => {
				const [incomeEvents, expenses] = await Promise.all([
					ctx.db
						.query("incomeEvents")
						.withIndex("by_profile_time", (q) => q.eq("profileId", profile._id))
						.order("desc")
						.take(10),
					ctx.db
						.query("expenses")
						.withIndex("by_profile_time", (q) => q.eq("profileId", profile._id))
						.order("desc")
						.take(10),
				]);

				const texts = [
					...incomeEvents.map((event) => event.description),
					...expenses.map((expense) => expense.description),
					...(profile.variableIncomeSources ?? []),
				];
				const matches = scanTextsForContentFlags(texts);
				return { profileId: profile._id, texts, matches };
			}),
		);

		const toFlag = scanResults.filter(({ profileId, matches }) => {
			if (!matches.length) return false;
			if (flaggedProfileIds.has(profileId)) return false;
			return highestSeverity(matches) !== null;
		});

		await Promise.all(
			toFlag.map(({ profileId, texts }) =>
				maybeFlagProfileFromTexts(ctx, profileId, texts, "content"),
			),
		);

		// Clear candidate flag after processing this batch (whether flagged or clean).
		await Promise.all(
			candidates.map((profile) => ctx.db.patch(profile._id, { needsContentReview: false })),
		);

		return {
			profilesScanned: candidates.length,
			flagsCreated: toFlag.length,
		};
	},
});
