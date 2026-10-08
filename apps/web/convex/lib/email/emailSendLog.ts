import { ConvexError, v } from "convex/values";
import type { MutationCtx } from "../../_generated/server";

const EMAIL_COOLDOWN_MS = 3 * 60 * 1000;

export type EmailSendKind = "verification" | "password_reset";

export async function assertEmailSendCooldown(
	ctx: MutationCtx,
	email: string,
	kind: EmailSendKind,
): Promise<void> {
	const normalized = email.trim().toLowerCase();
	const recent = await ctx.db
		.query("emailSendLog")
		.withIndex("by_email_kind", (q) => q.eq("email", normalized).eq("kind", kind))
		.order("desc")
		.first();

	if (recent && Date.now() - recent.sentAt < EMAIL_COOLDOWN_MS) {
		throw new ConvexError({
			code: "RATE_LIMITED",
			message: "Espera unos minutos antes de pedir otro correo.",
		});
	}
}

export async function recordEmailSend(
	ctx: MutationCtx,
	email: string,
	kind: EmailSendKind,
): Promise<void> {
	const normalized = email.trim().toLowerCase();
	await ctx.db.insert("emailSendLog", {
		email: normalized,
		kind,
		sentAt: Date.now(),
	});
}

export const emailSendKindValidator = v.union(
	v.literal("verification"),
	v.literal("password_reset"),
);
