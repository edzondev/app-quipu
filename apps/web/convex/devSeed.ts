import { hashPassword } from "better-auth/crypto";
import { ConvexError, v } from "convex/values";
import { components } from "./_generated/api";
import { internalMutation, type MutationCtx } from "./_generated/server";
import { assertDevSeedAllowed, devSeedPassword } from "./lib/devSeedGuard";
import { assertEmailAllowed } from "./lib/email/domainPolicy";
import { readEmailVerified } from "./lib/securityDevices";
import { type CreateProfileArgs, createProfileForUser } from "./profiles";

/** Nombre que Better Auth guarda; `createProfile` lo usa si el payload no trae nombre. */
const SEED_USER_NAME = "Maestro";

/**
 * Wizard móvil con los defaults (fijo, mensual, 50/30/20, Perú) al terminar
 * el paso de perfil. El móvil manda `completeOnboarding: false` y cierra el
 * flag en `startFirstCycle`. Aquí el flag queda en true y no hay ciclo: la
 * puerta de las tabs abre directo en «Aún no hay ciclo».
 */
const mobileProfileStep = {
	country: "Perú",
	currencyCode: "PEN",
	currencySymbol: "S/",
	incomeModel: "fixed",
	payFrequency: "monthly",
	paydays: [1],
	allocationNeeds: 50,
	allocationWants: 30,
	allocationSavings: 20,
	completeOnboarding: true,
} satisfies CreateProfileArgs;

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

function assertSeedDeployment(): void {
	assertDevSeedAllowed({
		allowDevSeed: process.env.ALLOW_DEV_SEED,
		cloudUrl: process.env.CONVEX_CLOUD_URL,
	});
}

async function assertAuthEmailFree(ctx: MutationCtx, email: string): Promise<void> {
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
}

async function insertVerifiedCredentialUser(
	ctx: MutationCtx,
	email: string,
	password: string,
): Promise<string> {
	const now = Date.now();
	const created = await ctx.runMutation(components.betterAuth.adapter.create, {
		input: {
			model: "user",
			data: {
				name: SEED_USER_NAME,
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
	return userId;
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
		assertSeedDeployment();
		const email = args.email.trim().toLowerCase();
		assertEmailAllowed(email);
		await assertAuthEmailFree(ctx, email);

		const userId = await insertVerifiedCredentialUser(
			ctx,
			email,
			await hashPassword(devSeedPassword(process.env.DEV_SEED_PASSWORD)),
		);
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

/**
 * Dev-only. Cuenta verificada con el perfil que deja el onboarding móvil
 * al terminar el paso de perfil, y sin ciclo (ni activo ni cerrado).
 * Maestro: `home-vacio`, `sin-ciclo-solo-ciclo-nuevo`, `home-primer-ingreso`.
 */
export const seedProfileNoCycle = internalMutation({
	args: { email: v.string() },
	returns: v.object({
		email: v.string(),
		userId: v.string(),
		emailVerified: v.literal(true),
		profileId: v.id("profiles"),
		hasCycle: v.literal(false),
	}),
	handler: async (ctx, args) => {
		assertSeedDeployment();
		const password = devSeedPassword(process.env.DEV_SEED_PASSWORD);
		const email = args.email.trim().toLowerCase();
		assertEmailAllowed(email);
		await assertAuthEmailFree(ctx, email);

		const userId = await insertVerifiedCredentialUser(ctx, email, await hashPassword(password));
		const profileId = await createProfileForUser(
			ctx,
			{ userId, fallbackName: SEED_USER_NAME },
			mobileProfileStep,
		);
		const cycle = await ctx.db
			.query("financialCycles")
			.withIndex("by_profile_status", (q) => q.eq("profileId", profileId))
			.first();
		if (cycle !== null) {
			throw new ConvexError({
				code: "INTERNAL",
				message: "La semilla no debe abrir un ciclo.",
			});
		}

		const stored = await ctx.runQuery(components.betterAuth.adapter.findOne, {
			model: "user",
			where: [{ field: "email", operator: "eq", value: email }],
		});
		if (!readEmailVerified(stored)) {
			throw new ConvexError({
				code: "INTERNAL",
				message: "La cuenta no quedó con el correo verificado.",
			});
		}

		return {
			email,
			userId,
			emailVerified: true as const,
			profileId,
			hasCycle: false as const,
		};
	},
});
