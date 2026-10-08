import { describe, expect, it } from "vitest";
import {
	buildTeamFeedbackEmail,
	buildUserFeedbackConfirmationEmail,
	getFeedbackCategoryLabel,
} from "./feedbackMail";

const sampleContext = {
	submissionId: "feedback123",
	category: "question" as const,
	message: "¿Cómo cambio mi ciclo de pago?",
	userName: "Ana García",
	userEmail: "ana@example.com",
	plan: "free" as const,
	pagePath: "/settings/feedback",
	userAgent: "Mozilla/5.0",
};

function assertNoForbiddenClickCopy(value: string) {
	expect(value.toLowerCase()).not.toContain("click aquí");
	expect(value.toLowerCase()).not.toContain("click here");
	expect(value.toLowerCase()).not.toContain("haz clic aquí");
}

describe("buildTeamFeedbackEmail", () => {
	it("uses category and user name in subject", () => {
		const email = buildTeamFeedbackEmail(sampleContext);
		expect(email.subject).toBe("[Quipu] Consulta — Ana García");
	});

	it("includes message and metadata in html and text", () => {
		const email = buildTeamFeedbackEmail(sampleContext);
		expect(email.html).toContain("¿Cómo cambio mi ciclo de pago?");
		expect(email.text).toContain("¿Cómo cambio mi ciclo de pago?");
		expect(email.html).toContain("/settings/feedback");
		expect(email.html).toContain("feedback123");
		expect(email.html).toContain("ana@example.com");
		assertNoForbiddenClickCopy(email.html);
		assertNoForbiddenClickCopy(email.text);
	});

	it("includes table layout and reply cta when user email exists", () => {
		const email = buildTeamFeedbackEmail(sampleContext);
		expect(email.html.toLowerCase()).toContain("<table");
		expect(email.html).toContain("Responder al usuario");
		expect(email.html).toContain("mailto:ana@example.com");
	});

	it("escapes malicious user name in html", () => {
		const email = buildTeamFeedbackEmail({
			...sampleContext,
			userName: '<script>alert("x")</script>',
			message: "Mensaje <b>seguro</b>",
		});
		expect(email.html).not.toContain("<script>alert");
		expect(email.html).toContain("&lt;script&gt;");
	});
});

describe("buildUserFeedbackConfirmationEmail", () => {
	it("uses confirmation subject and calm copy", () => {
		const email = buildUserFeedbackConfirmationEmail(sampleContext);
		expect(email.subject).toBe("Recibimos tu mensaje");
		expect(email.html).toContain("Gracias por escribirnos");
		expect(email.html).toContain("Respondemos pronto");
		expect(email.text).toContain("Respondemos pronto");
		assertNoForbiddenClickCopy(email.html);
		assertNoForbiddenClickCopy(email.text);
	});

	it("includes category label and message copy", () => {
		const email = buildUserFeedbackConfirmationEmail({
			...sampleContext,
			category: "problem",
		});
		expect(email.html).toContain("Problema");
		expect(email.text).toContain("Problema");
		expect(email.html).toContain(sampleContext.message);
	});

	it("greets user by name", () => {
		const email = buildUserFeedbackConfirmationEmail(sampleContext);
		expect(email.html).toContain("Hola, Ana García");
		expect(email.text).toContain("Hola, Ana García");
	});
});

describe("getFeedbackCategoryLabel", () => {
	it("maps categories to Spanish labels", () => {
		expect(getFeedbackCategoryLabel("problem")).toBe("Problema");
		expect(getFeedbackCategoryLabel("improvement")).toBe("Mejora");
		expect(getFeedbackCategoryLabel("question")).toBe("Consulta");
	});
});
