import { describe, expect, it } from "vitest";
import { escapeHtml } from "./authEmailLayout";
import { buildOtpEmail, buildPasswordResetEmail, buildVerificationEmail } from "./authTemplates";

const sampleUrl = "https://app.quipu.example/verify?token=abc123";

function assertNoForbiddenClickCopy(value: string) {
	expect(value.toLowerCase()).not.toContain("click aquí");
	expect(value.toLowerCase()).not.toContain("click here");
	expect(value.toLowerCase()).not.toContain("haz clic aquí");
}

describe("buildVerificationEmail", () => {
	it("includes url in html and text", () => {
		const email = buildVerificationEmail({ url: sampleUrl });
		expect(email.html).toContain(sampleUrl);
		expect(email.text).toContain(sampleUrl);
	});

	it("uses verification subject, headline, and cta label", () => {
		const email = buildVerificationEmail({ url: sampleUrl });
		expect(email.subject).toBe("Confirma tu correo en Quipu");
		expect(email.html).toContain("Confirma tu correo");
		expect(email.html).toContain("Confirmar correo");
		expect(email.text).toContain("Confirmar correo");
	});

	it("includes table layout and passkey note", () => {
		const email = buildVerificationEmail({ url: sampleUrl });
		expect(email.html.toLowerCase()).toContain("<table");
		expect(email.html).toContain("Passkey sigue disponible");
		assertNoForbiddenClickCopy(email.html);
		assertNoForbiddenClickCopy(email.text);
	});

	it("greets by name when provided", () => {
		const email = buildVerificationEmail({ name: "Ana", url: sampleUrl });
		expect(email.html).toContain("Hola, Ana");
		expect(email.text).toContain("Hola, Ana");
	});

	it("omits name greeting when name is absent", () => {
		const email = buildVerificationEmail({ url: sampleUrl });
		expect(email.html).not.toContain("Hola,");
		expect(email.text).not.toContain("Hola,");
	});
});

describe("buildPasswordResetEmail", () => {
	it("includes url in html and text", () => {
		const email = buildPasswordResetEmail({ url: sampleUrl });
		expect(email.html).toContain(sampleUrl);
		expect(email.text).toContain(sampleUrl);
	});

	it("uses reset subject, headline, cta, and expiry copy", () => {
		const email = buildPasswordResetEmail({ url: sampleUrl });
		expect(email.subject).toBe("Restablece tu contraseña en Quipu");
		expect(email.html).toContain("Elige una contraseña nueva");
		expect(email.html).toContain("Restablecer contraseña");
		expect(email.html).toContain("El enlace caduca en una hora.");
		expect(email.text).toContain("El enlace caduca en una hora.");
		assertNoForbiddenClickCopy(email.html);
		assertNoForbiddenClickCopy(email.text);
	});

	it("includes ignore footer and greets by name", () => {
		const email = buildPasswordResetEmail({
			name: "Luis",
			url: sampleUrl,
		});
		expect(email.html).toContain("Si no lo pediste, ignora este correo.");
		expect(email.html).toContain("Hola, Luis");
	});
});

describe("escapeHtml", () => {
	it("escapes script tags in user-provided name", () => {
		const malicious = '<script>alert("x")</script>';
		const escaped = escapeHtml(malicious);
		expect(escaped).not.toContain("<script>");
		expect(escaped).toContain("&lt;script&gt;");

		const email = buildVerificationEmail({
			name: malicious,
			url: sampleUrl,
		});
		expect(email.html).not.toContain("<script>alert");
		expect(email.html).toContain("&lt;script&gt;");
	});
});

describe("buildOtpEmail", () => {
	it("incluye el código de 6 dígitos en texto y asunto", () => {
		const email = buildOtpEmail({ code: "482913" });
		expect(email.text).toContain("482913");
		expect(email.subject).toContain("482913");
	});

	it("incluye el código en el html y caducidad de 10 minutos", () => {
		const email = buildOtpEmail({ code: "482913" });
		expect(email.html).toContain("482913");
		expect(email.text).toContain("10 minutos");
	});

	it("el html del OTP no contiene links", () => {
		const email = buildOtpEmail({ code: "482913" });
		expect(email.html).not.toContain("<a ");
	});
});
