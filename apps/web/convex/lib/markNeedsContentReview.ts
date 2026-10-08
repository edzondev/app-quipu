import type { Id } from "../_generated/dataModel";
import type { MutationCtx } from "../_generated/server";
import { scanTextsForContentFlags } from "./contentFlags";

/**
 * I8 — marca el perfil como candidato para el cron de revisión de contenido.
 * No crea flags aquí: el cron `contentReviewScan` confirma y encola.
 */
export async function markNeedsContentReviewIfSuspicious(
	ctx: Pick<MutationCtx, "db">,
	profileId: Id<"profiles">,
	texts: Array<string | undefined | null>,
): Promise<void> {
	if (scanTextsForContentFlags(texts).length === 0) return;
	await ctx.db.patch(profileId, { needsContentReview: true });
}
