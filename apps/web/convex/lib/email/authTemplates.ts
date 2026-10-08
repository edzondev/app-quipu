import { renderAuthEmailHtml } from "./authEmailLayout";

type AuthEmailBuildInput = {
	name?: string;
	url: string;
};

function buildGreeting(name?: string): string | undefined {
	if (!name?.trim()) {
		return undefined;
	}
	return `Hola, ${name.trim()}`;
}

function buildPlainText(parts: {
	headline: string;
	greeting?: string;
	paragraphs: string[];
	ctaLabel?: string;
	url?: string;
	code?: string;
	secondaryNote?: string;
	footerLines: string[];
}): string {
	const lines: string[] = [parts.headline, ""];

	if (parts.greeting) {
		lines.push(parts.greeting, "");
	}

	for (const paragraph of parts.paragraphs) {
		lines.push(paragraph, "");
	}

	if (parts.ctaLabel !== undefined && parts.url !== undefined) {
		lines.push(`${parts.ctaLabel}: ${parts.url}`, "");
	}

	if (parts.code !== undefined) {
		lines.push(parts.code, "");
	}

	if (parts.secondaryNote) {
		lines.push(parts.secondaryNote, "");
	}

	for (const footer of parts.footerLines) {
		lines.push(footer);
	}

	return lines.join("\n").trim();
}

export function buildVerificationEmail(input: AuthEmailBuildInput): {
	subject: string;
	html: string;
	text: string;
} {
	const greeting = buildGreeting(input.name);
	const paragraphs = [
		"Gracias por unirte a Quipu. Solo falta un paso para activar el acceso con contraseña.",
		"Passkey sigue disponible mientras verificas tu correo.",
	];
	const ctaLabel = "Confirmar correo";
	const headline = "Confirma tu correo";

	const html = renderAuthEmailHtml({
		preheader: "Un paso más para activar tu cuenta en Quipu.",
		headline,
		greeting,
		paragraphs,
		cta: { label: ctaLabel, href: input.url },
		footerLines: ["Si no creaste una cuenta en Quipu, puedes ignorar este correo."],
	});

	const text = buildPlainText({
		headline,
		greeting,
		paragraphs,
		ctaLabel,
		url: input.url,
		footerLines: ["Si no creaste una cuenta en Quipu, puedes ignorar este correo."],
	});

	return {
		subject: "Confirma tu correo en Quipu",
		html,
		text,
	};
}

export function buildPasswordResetEmail(input: AuthEmailBuildInput): {
	subject: string;
	html: string;
	text: string;
} {
	const greeting = buildGreeting(input.name);
	const paragraphs = ["Recibimos una solicitud para restablecer la contraseña de tu cuenta."];
	const ctaLabel = "Restablecer contraseña";
	const headline = "Elige una contraseña nueva";
	const secondaryNote = "El enlace caduca en una hora.";
	const footerLines = ["Si no lo pediste, ignora este correo."];

	const html = renderAuthEmailHtml({
		preheader: "Restablece tu contraseña de Quipu (válido 1 hora).",
		headline,
		greeting,
		paragraphs,
		cta: { label: ctaLabel, href: input.url },
		secondaryNote,
		footerLines,
	});

	const text = buildPlainText({
		headline,
		greeting,
		paragraphs,
		ctaLabel,
		url: input.url,
		secondaryNote,
		footerLines,
	});

	return {
		subject: "Restablece tu contraseña en Quipu",
		html,
		text,
	};
}

type OtpEmailBuildInput = {
	code: string;
};

export function buildOtpEmail(input: OtpEmailBuildInput): {
	subject: string;
	html: string;
	text: string;
} {
	const headline = "Confirma tu correo";
	const paragraphs = ["Tu código para confirmar tu correo en Quipu es:"];
	const footerLines = [
		"El código caduca en 10 minutos.",
		"Si no creaste una cuenta en Quipu, puedes ignorar este correo.",
	];

	const html = renderAuthEmailHtml({
		preheader: "Un paso más para activar tu cuenta en Quipu.",
		headline,
		paragraphs,
		code: input.code,
		footerLines,
	});

	const text = buildPlainText({
		headline,
		paragraphs,
		code: input.code,
		footerLines,
	});

	return {
		subject: `Tu código de Quipu: ${input.code}`,
		html,
		text,
	};
}
