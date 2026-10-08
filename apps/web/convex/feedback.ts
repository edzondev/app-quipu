import { ConvexError, v } from "convex/values";
import { mutation } from "./_generated/server";
import { sendTeamFeedbackEmail, sendUserFeedbackConfirmationEmail } from "./lib/email/feedbackMail";
import { authRateLimiter } from "./lib/rateLimit";

const feedbackCategoryValidator = v.union(
	v.literal("problem"),
	v.literal("improvement"),
	v.literal("question"),
);

function validateFeedbackMessage(message: string): string {
	const trimmed = message.trim();
	if (trimmed.length < 10) {
		throw new ConvexError({
			code: "VALIDATION_ERROR",
			message: "El mensaje debe tener al menos 10 caracteres.",
			data: { field: "message" },
		});
	}
	if (trimmed.length > 2000) {
		throw new ConvexError({
			code: "VALIDATION_ERROR",
			message: "El mensaje debe tener como máximo 2000 caracteres.",
			data: { field: "message" },
		});
	}
	return trimmed;
}

function validatePagePath(pagePath: string | undefined): string | undefined {
	if (pagePath === undefined) {
		return undefined;
	}
	const trimmed = pagePath.trim();
	if (!trimmed) {
		return undefined;
	}
	if (trimmed.length > 200) {
		throw new ConvexError({
			code: "VALIDATION_ERROR",
			message: "La ruta es demasiado larga.",
			data: { field: "pagePath" },
		});
	}
	return trimmed;
}

export const submitFeedback = mutation({
	args: {
		category: feedbackCategoryValidator,
		message: v.string(),
		pagePath: v.optional(v.string()),
		userAgent: v.optional(v.string()),
	},
	returns: v.id("feedbackSubmissions"),
	handler: async (ctx, args) => {
		const identity = await ctx.auth.getUserIdentity();
		if (!identity) {
			throw new ConvexError({
				code: "UNAUTHORIZED",
				message: "Debes iniciar sesión con tu Passkey o credencial.",
			});
		}

		const message = validateFeedbackMessage(args.message);
		const pagePath = validatePagePath(args.pagePath);

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

		try {
			await authRateLimiter.limit(ctx, "feedbackSubmit", {
				key: profile._id,
				throws: true,
			});
		} catch {
			throw new ConvexError({
				code: "RATE_LIMITED",
				message: "Has enviado varios mensajes recientemente. Espera un poco e intenta de nuevo.",
			});
		}

		const userEmail = identity.email?.trim() || undefined;
		const submissionId = await ctx.db.insert("feedbackSubmissions", {
			userId: identity.subject,
			profileId: profile._id,
			category: args.category,
			message,
			userEmail,
			userName: profile.name,
			plan: profile.plan,
			pagePath,
			userAgent: args.userAgent?.trim() || undefined,
			createdAt: Date.now(),
			teamEmailStatus: "skipped",
			userEmailStatus: "skipped",
		});

		let teamEmailStatus: "sent" | "failed" | "skipped" = "failed";
		try {
			await sendTeamFeedbackEmail({
				submissionId,
				category: args.category,
				message,
				userName: profile.name,
				userEmail,
				plan: profile.plan,
				pagePath,
				userAgent: args.userAgent?.trim() || undefined,
			});
			teamEmailStatus = "sent";
		} catch (error) {
			console.error("Feedback team email failed:", {
				submissionId,
				error: error instanceof Error ? error.message : "Unknown error",
			});
			teamEmailStatus = "failed";
		}

		let userEmailStatus: "sent" | "failed" | "skipped" = "skipped";
		if (userEmail) {
			try {
				await sendUserFeedbackConfirmationEmail({
					submissionId,
					category: args.category,
					message,
					userName: profile.name,
					userEmail,
					plan: profile.plan,
					pagePath,
					userAgent: args.userAgent?.trim() || undefined,
				});
				userEmailStatus = "sent";
			} catch (error) {
				console.error("Feedback user confirmation email failed:", {
					submissionId,
					error: error instanceof Error ? error.message : "Unknown error",
				});
				userEmailStatus = "failed";
			}
		}

		await ctx.db.patch(submissionId, {
			teamEmailStatus,
			userEmailStatus,
		});

		return submissionId;
	},
});
