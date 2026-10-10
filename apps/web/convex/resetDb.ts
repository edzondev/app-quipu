import { components, internal } from "./_generated/api";
import { type ActionCtx, internalAction } from "./_generated/server";
import { assertDevCloudOnly } from "./lib/devCloudGuard";

const AUTH_MODELS = ["user", "session", "account", "verification", "jwks", "passkey"] as const;

async function deleteAuthModel(
	ctx: ActionCtx,
	model: (typeof AUTH_MODELS)[number],
): Promise<number> {
	const result = await ctx.runMutation(components.betterAuth.adapter.deleteMany, {
		input: { model },
		paginationOpts: { numItems: 999999, cursor: null },
	});
	return Array.isArray(result) ? result.length : 0;
}

/** Dev only: borra JWKS cuando BETTER_AUTH_SECRET cambió y el descifrado falla. */
export const resetJwks = internalAction({
	args: {},
	handler: async (ctx): Promise<{ deleted: number }> => {
		assertDevCloudOnly(process.env.CONVEX_CLOUD_URL);
		const deleted = await deleteAuthModel(ctx, "jwks");
		return { deleted };
	},
});

// Solo para testing contra la BD de desarrollo. internalAction: jamás
// invocable desde clientes públicos; se ejecuta con `npx convex run` o dashboard.
export const resetAll = internalAction({
	args: {},
	handler: async (ctx): Promise<{ deleted: Record<string, number> }> => {
		assertDevCloudOnly(process.env.CONVEX_CLOUD_URL);
		const appResult = await ctx.runMutation(internal.lib.resetAppTables.resetAppTables);
		const appDeleted: Record<string, number> =
			(appResult as { deleted?: Record<string, number> } | null)?.deleted ?? {};

		const authEntries = await Promise.all(
			AUTH_MODELS.map(async (model) => {
				const deleted = await deleteAuthModel(ctx, model);
				return [model, deleted] as const;
			}),
		);
		const authCounts = Object.fromEntries(authEntries);

		return { deleted: { ...appDeleted, ...authCounts } };
	},
});
