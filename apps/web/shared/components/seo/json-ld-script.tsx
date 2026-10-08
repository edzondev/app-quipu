type JsonLdScriptProps = {
	data: Record<string, unknown> | Record<string, unknown>[];
};

/**
 * Serializa un objeto JSON-LD a `<script type="application/ld+json">`.
 *
 * Escapes aplicados al output (defensa en profundidad, no rompen el JSON):
 *  - `<` → `\u003c` evita que aparezca un `</script>` dentro del JSON.
 *  - `&` → `\u0026` neutraliza entidades HTML en parsers legacy.
 *  - U+2028 / U+2029 → sus escapes, ya que estos separadores rompen
 *    parsers JS antiguos (ES2019+ los acepta en string literals).
 */
const U2028_RE = new RegExp(String.fromCharCode(0x2028), "g");
const U2029_RE = new RegExp(String.fromCharCode(0x2029), "g");

export function JsonLdScript({ data }: JsonLdScriptProps) {
	const json = JSON.stringify(data)
		.replace(/</g, "\\u003c")
		.replace(/&/g, "\\u0026")
		.replace(U2028_RE, "\\u2028")
		.replace(U2029_RE, "\\u2029");
	return (
		<script
			type="application/ld+json"
			// biome-ignore lint/security/noDangerouslySetInnerHtml: serializar JSON-LD es el único caso válido de dangerouslySetInnerHTML (canónico para schema.org/Google); el input está controlado y los escapes anteriores neutralizan `</script>` y entidades HTML.
			dangerouslySetInnerHTML={{ __html: json }}
		/>
	);
}
