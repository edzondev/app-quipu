import { hashPassword } from "better-auth/crypto";
import { ConvexError, v } from "convex/values";
import { components } from "./_generated/api";
import { internalMutation } from "./_generated/server";
import { assertDevSeedAllowed } from "./lib/devSeedGuard";
import { assertEmailAllowed } from "./lib/email/domainPolicy";

/** Password for Maestro sign-in. Email + this password, already verified. */
export const DEV_SEED_PASSWORD = "QuipuMaestro229";

function readCreatedId(created: unknown): string {
	if (typeof created === "string" && created.length > 0) return created;
	if (
		created !== null &&
		typeof created === "object" &&
		"_id" in created &&
		typeof created._id === "string"
	) {
		return created._id;
	}
	throw new ConvexError({
		code: "INTERNAL",
		message: "No se pudo crear la cuenta.",
	});
}

function authUserExists(found: unknown): boolean {
	return found !== null && typeof found === "object";
}

/**
 * Dev-only. Creates a verified Better Auth user with no profile so Maestro
 * can sign in and land on onboarding. Not a public function.
 */
export const seedVerifiedAccount = internalMutation({
	args: { email: v.string() },
	returns: v.object({
		email: v.string(),
		userId: v.string(),
		emailVerified: v.literal(true),
		hasProfile: v.boolean(),
	}),
	handler: async (ctx, args) => {
		assertDevSeedAllowed({
			allowDevSeed: process.env.ALLOW_DEV_SEED,
			cloudUrl: process.env.CONVEX_CLOUD_URL,
		});

		const email = args.email.trim().toLowerCase();
		assertEmailAllowed(email);

		const existing = await ctx.runQuery(components.betterAuth.adapter.findOne, {
			model: "user",
			where: [{ field: "email", operator: "eq", value: email }],
		});
		if (authUserExists(existing)) {
			throw new ConvexError({
				code: "ALREADY_EXISTS",
				message: "Ya existe una cuenta con ese correo.",
			});
		}

		const now = Date.now();
		const password = await hashPassword(DEV_SEED_PASSWORD);
		const created = await ctx.runMutation(components.betterAuth.adapter.create, {
			input: {
				model: "user",
				data: {
					name: "Maestro",
					email,
					emailVerified: true,
					createdAt: now,
					updatedAt: now,
				},
			},
		});
		const userId = readCreatedId(created);
		await ctx.runMutation(components.betterAuth.adapter.create, {
			input: {
				model: "account",
				data: {
					accountId: userId,
					providerId: "credential",
					userId,
					password,
					createdAt: now,
					updatedAt: now,
				},
			},
		});

		const profile = await ctx.db
			.query("profiles")
			.withIndex("by_userId", (q) => q.eq("userId", userId))
			.unique();

		return {
			email,
			userId,
			emailVerified: true as const,
			hasProfile: profile !== null,
		};
	},
});
