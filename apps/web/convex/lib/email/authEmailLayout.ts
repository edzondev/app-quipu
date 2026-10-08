import { authEmailColors, authEmailFonts, authEmailLayout } from "./authEmailTokens";

export type AuthEmailLayoutInput = {
	preheader: string;
	headline: string;
	greeting?: string;
	paragraphs: string[];
	/**
	 * Contrato: exactamente uno de `cta` o `code` debe estar presente.
	 * - `cta`: correos con enlace (verification, password reset) → renderiza
	 *   el bloque de botón + fallback de URL.
	 * - `code`: correos con código de un solo uso (OTP) → renderiza el bloque
	 *   de código monospace, sin ningún link.
	 */
	cta?: { label: string; href: string };
	code?: string;
	secondaryNote?: string;
	footerLines: string[];
};

const HTML_ESCAPE_MAP: Record<string, string> = {
	"&": "&amp;",
	"<": "&lt;",
	">": "&gt;",
	'"': "&quot;",
	"'": "&#39;",
};

export function escapeHtml(text: string): string {
	return text.replace(/[&<>"']/g, (char) => HTML_ESCAPE_MAP[char] ?? char);
}

function escapeAttr(text: string): string {
	return escapeHtml(text);
}

export function renderAuthEmailHtml(input: AuthEmailLayoutInput): string {
	if (Boolean(input.cta) === Boolean(input.code)) {
		throw new Error(
			"Auth email requiere exactamente uno de `cta` o `code` (no ambos, no ninguno).",
		);
	}

	const preheader = escapeHtml(input.preheader);
	const headline = escapeHtml(input.headline);
	const greetingBlock = input.greeting
		? `<p style="margin:0 0 16px;font-family:${authEmailFonts.sans};font-size:15px;line-height:1.5;color:${authEmailColors.body};">${escapeHtml(input.greeting)}</p>`
		: "";

	const paragraphBlocks = input.paragraphs
		.map(
			(p) =>
				`<p style="margin:0 0 16px;font-family:${authEmailFonts.sans};font-size:15px;line-height:1.55;color:${authEmailColors.body};">${escapeHtml(p)}</p>`,
		)
		.join("");

	const ctaLabel = input.cta ? escapeHtml(input.cta.label) : "";
	const ctaHref = input.cta ? escapeAttr(input.cta.href) : "";
	const plainUrl = input.cta ? escapeHtml(input.cta.href) : "";
	const codeBlock = input.code
		? `<div style="margin:8px 0 20px;"><span style="display:inline-block;padding:12px 24px;border:1px solid #E8E6DF;border-radius:8px;font-family:monospace;font-size:32px;letter-spacing:12px;color:${authEmailColors.ink};">${escapeHtml(input.code)}</span></div>`
		: "";
	const ctaBlocks = input.cta
		? `<table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:8px 0 20px;">
                      <tr>
                        <td align="left" style="border-radius:8px;background-color:${authEmailColors.deep};">
                          <a href="${ctaHref}" style="display:inline-block;padding:14px 28px;font-family:${authEmailFonts.sans};font-size:15px;font-weight:600;line-height:1.2;color:${authEmailColors.onDeep};text-decoration:none;border-radius:8px;background-color:${authEmailColors.deep};">${ctaLabel}</a>
                        </td>
                      </tr>
                    </table>
                    <p style="margin:0 0 4px;font-family:${authEmailFonts.sans};font-size:13px;line-height:1.5;color:${authEmailColors.body};">Si el botón no funciona, copia y pega este enlace en tu navegador:</p>
                    <p style="margin:0 0 0;font-family:${authEmailFonts.sans};font-size:13px;line-height:1.5;word-break:break-all;"><a href="${ctaHref}" style="color:${authEmailColors.deep};text-decoration:underline;">${plainUrl}</a></p>`
		: "";

	const secondaryBlock = input.secondaryNote
		? `<p style="margin:16px 0 0;font-family:${authEmailFonts.sans};font-size:13px;line-height:1.5;color:${authEmailColors.body};">${escapeHtml(input.secondaryNote)}</p>`
		: "";

	const footerBlocks = input.footerLines
		.map(
			(line) =>
				`<p style="margin:0 0 8px;font-family:${authEmailFonts.sans};font-size:12px;line-height:1.45;color:${authEmailColors.body};">${escapeHtml(line)}</p>`,
		)
		.join("");

	return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <meta http-equiv="X-UA-Compatible" content="IE=edge" />
  <title>${headline}</title>
</head>
<body style="margin:0;padding:0;background-color:${authEmailColors.canvas};">
  <div style="display:none;max-height:0;overflow:hidden;opacity:0;color:transparent;mso-hide:all;">${preheader}</div>
  <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="background-color:${authEmailColors.canvas};">
    <tr>
      <td align="center" style="padding:32px 16px;">
        <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="${authEmailLayout.maxWidth}" style="max-width:${authEmailLayout.maxWidth}px;width:100%;">
          <tr>
            <td style="background-color:${authEmailColors.surface};border-radius:${authEmailLayout.cardRadius}px;box-shadow:${authEmailLayout.cardShadow};border:1px solid ${authEmailColors.line};overflow:hidden;">
              <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
                <tr>
                  <td width="${authEmailLayout.accentBarWidth}" style="width:${authEmailLayout.accentBarWidth}px;background-color:${authEmailColors.moss};font-size:0;line-height:0;">&nbsp;</td>
                  <td style="padding:28px 32px 32px;">
                    <p style="margin:0 0 24px;font-family:${authEmailFonts.serif};font-size:14px;letter-spacing:0.06em;color:${authEmailColors.moss};">Quipu</p>
                    <h1 style="margin:0 0 20px;font-family:${authEmailFonts.serif};font-size:26px;font-weight:600;line-height:1.25;color:${authEmailColors.ink};">${headline}</h1>
                    ${greetingBlock}
                    ${paragraphBlocks}
                    ${codeBlock}${ctaBlocks}
                    ${secondaryBlock}
                    <hr style="border:none;border-top:1px solid ${authEmailColors.line};margin:28px 0 20px;" />
                    ${footerBlocks}
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}
