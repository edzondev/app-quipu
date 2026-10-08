import { ConvexError } from "convex/values";

/** Dominios desechables / abusivos observados + typos comunes de Gmail. */
const BLOCKED_EMAIL_DOMAINS = new Set([
	"kierko.com",
	"gmxxail.com",
	"guerrillamail.com",
	"guerrillamail.net",
	"mailinator.com",
	"tempmail.com",
	"throwaway.email",
	"yopmail.com",
	"10minutemail.com",
	"trashmail.com",
	"sharklasers.com",
	"getnada.com",
]);

const GMAIL_TYPO_PATTERNS = [
	// gm + 2–4 chars + ail (p. ej. gmxxail.com). No usar gmai[l1]: también matchea gmail.com.
	/^gm[a-z]{2,4}ail\.com$/i,
	/^gmai\.com$/i,
	/^gmai1\.com$/i,
	/^gnail\.com$/i,
];

export function extractEmailDomain(email: string): string {
	const at = email.lastIndexOf("@");
	if (at < 1) return "";
	return email
		.slice(at + 1)
		.trim()
		.toLowerCase();
}

export function isBlockedEmailDomain(domain: string): boolean {
	if (BLOCKED_EMAIL_DOMAINS.has(domain)) return true;
	return GMAIL_TYPO_PATTERNS.some((pattern) => pattern.test(domain));
}

export function assertEmailAllowed(email: string): void {
	const normalized = email.trim().toLowerCase();
	const domain = extractEmailDomain(normalized);
	if (!domain) {
		throw new ConvexError({
			code: "INVALID_EMAIL",
			message: "Correo inválido.",
		});
	}
	if (isBlockedEmailDomain(domain)) {
		throw new ConvexError({
			code: "EMAIL_NOT_ALLOWED",
			message: "No podemos registrar cuentas con ese dominio de correo.",
		});
	}
}

export function validateEmailAllowed(email: string): boolean {
	try {
		assertEmailAllowed(email);
		return true;
	} catch {
		return false;
	}
}
