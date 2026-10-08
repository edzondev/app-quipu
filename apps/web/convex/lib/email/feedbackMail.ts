import { renderAuthEmailHtml } from "./authEmailLayout";
import { sendOutboundEmail } from "./send";

export type FeedbackCategory = "problem" | "improvement" | "question";

const CATEGORY_LABELS: Record<FeedbackCategory, string> = {
	problem: "Problema",
	improvement: "Mejora",
	question: "Consulta",
};

const PLAN_LABELS = {
	free: "Gratis",
	premium: "Quipu Plus",
} as const;

export type FeedbackSubmissionEmailContext = {
	submissionId: string;
	category: FeedbackCategory;
	message: string;
	userName: string;
	userEmail?: string;
	plan: "free" | "premium";
	pagePath?: string;
	userAgent?: string;
};

function buildPlainText(parts: {
	headline: string;
	greeting?: string;
	paragraphs: string[];
	footerLines: string[];
}): string {
	const lines: string[] = [parts.headline, ""];

	if (parts.greeting) {
		lines.push(parts.greeting, "");
	}

	for (const paragraph of parts.paragraphs) {
		lines.push(paragraph, "");
	}

	for (const footer of parts.footerLines) {
		lines.push(footer);
	}

	return lines.join("\n").trim();
}

function formatMetadataLines(ctx: FeedbackSubmissionEmailContext): string[] {
	const lines = [
		`Categoría: ${CATEGORY_LABELS[ctx.category]}`,
		`Plan: ${PLAN_LABELS[ctx.plan]}`,
		`ID: ${ctx.submissionId}`,
	];

	if (ctx.userEmail) {
		lines.push(`Correo: ${ctx.userEmail}`);
	}

	if (ctx.pagePath) {
		lines.push(`Ruta: ${ctx.pagePath}`);
	}

	if (ctx.userAgent) {
		lines.push(`Navegador: ${ctx.userAgent}`);
	}

	return lines;
}

export function buildTeamFeedbackEmail(ctx: FeedbackSubmissionEmailContext): {
	subject: string;
	html: string;
	text: string;
} {
	const categoryLabel = CATEGORY_LABELS[ctx.category];
	const subject = `[Quipu] ${categoryLabel} — ${ctx.userName.trim()}`;
	const headline = `Nuevo feedback: ${categoryLabel}`;
	const greeting = `De ${ctx.userName.trim()}`;
	const metadataLines = formatMetadataLines(ctx);
	const paragraphs = [`Mensaje:\n${ctx.message.trim()}`, metadataLines.join("\n")];
	const siteUrl = process.env.SITE_URL ?? "https://app.quipu.pe";
	const ctaHref = ctx.userEmail
		? `mailto:${ctx.userEmail}?subject=${encodeURIComponent(`Re: tu mensaje en Quipu (${categoryLabel})`)}`
		: siteUrl;
	const ctaLabel = ctx.userEmail ? "Responder al usuario" : "Abrir Quipu";

	const html = renderAuthEmailHtml({
		preheader: `${categoryLabel} de ${ctx.userName.trim()} en Quipu.`,
		headline,
		greeting,
		paragraphs,
		cta: { label: ctaLabel, href: ctaHref },
		footerLines: ["Enviado desde el formulario de feedback in-app."],
	});

	const text = buildPlainText({
		headline,
		greeting,
		paragraphs,
		footerLines: ["Enviado desde el formulario de feedback in-app."],
	});

	return { subject, html, text };
}

export function buildUserFeedbackConfirmationEmail(ctx: FeedbackSubmissionEmailContext): {
	subject: string;
	html: string;
	text: string;
} {
	const categoryLabel = CATEGORY_LABELS[ctx.category];
	const subject = "Recibimos tu mensaje";
	const headline = "Gracias por escribirnos";
	const greeting = `Hola, ${ctx.userName.trim()}`;
	const paragraphs = [
		"Recibimos tu mensaje y lo revisará alguien del equipo.",
		`Tipo: ${categoryLabel}`,
		`Tu mensaje:\n${ctx.message.trim()}`,
		"Respondemos pronto por correo si hace falta dar seguimiento.",
	];
	const siteUrl = process.env.SITE_URL ?? "https://app.quipu.pe";

	const html = renderAuthEmailHtml({
		preheader: "Tu feedback llegó al equipo de Quipu.",
		headline,
		greeting,
		paragraphs,
		cta: { label: "Volver a Quipu", href: siteUrl },
		footerLines: ["Si no enviaste este mensaje, escríbenos a soporte@quipu.pe."],
	});

	const text = buildPlainText({
		headline,
		greeting,
		paragraphs,
		footerLines: [
			"Si no enviaste este mensaje, escríbenos a soporte@quipu.pe.",
			"",
			`Volver a Quipu: ${siteUrl}`,
		],
	});

	return { subject, html, text };
}

function feedbackInboxEmail(): string {
	return process.env.FEEDBACK_INBOX_EMAIL ?? "soporte@quipu.pe";
}

export async function sendTeamFeedbackEmail(ctx: FeedbackSubmissionEmailContext): Promise<void> {
	const email = buildTeamFeedbackEmail(ctx);
	await sendOutboundEmail({
		to: feedbackInboxEmail(),
		subject: email.subject,
		html: email.html,
		text: email.text,
		idempotencyKey: `feedback-team/${ctx.submissionId}`,
	});
}

export async function sendUserFeedbackConfirmationEmail(
	ctx: FeedbackSubmissionEmailContext,
): Promise<void> {
	if (!ctx.userEmail?.trim()) {
		return;
	}

	const email = buildUserFeedbackConfirmationEmail(ctx);
	await sendOutboundEmail({
		to: ctx.userEmail.trim(),
		subject: email.subject,
		html: email.html,
		text: email.text,
		idempotencyKey: `feedback-confirm/${ctx.submissionId}`,
	});
}

export function getFeedbackCategoryLabel(category: FeedbackCategory): string {
	return CATEGORY_LABELS[category];
}
