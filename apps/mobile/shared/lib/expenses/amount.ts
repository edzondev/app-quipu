/**
 * Convierte un monto escrito por la persona a céntimos enteros.
 * El último separador (punto o coma) es el decimal; el otro, si aparece,
 * se trata como separador de miles. Más de dos decimales no es válido.
 */
export function parseAmountToCents(raw: string): number | null {
	const compact = raw.trim().replace(/\s/g, "");
	if (!compact || !/^[\d.,]+$/.test(compact)) return null;

	const lastDot = compact.lastIndexOf(".");
	const lastComma = compact.lastIndexOf(",");
	const decimalAt = Math.max(lastDot, lastComma);

	if (decimalAt === -1) {
		return wholeToCents(compact);
	}

	const decimalSep = compact[decimalAt];
	const fraction = compact.slice(decimalAt + 1);
	if (fraction.length > 2 || !/^\d*$/.test(fraction)) return null;

	const integerRaw = compact.slice(0, decimalAt);
	if (integerRaw.includes(decimalSep)) return null;

	const thousandsSep = decimalSep === "." ? "," : ".";
	const integer = integerRaw.split(thousandsSep).join("");
	if (!/^\d*$/.test(integer)) return null;

	return wholeToCents(integer || "0", fraction.padEnd(2, "0"));
}

export function centsToAmountRaw(cents: number): string {
	const safe = Math.max(0, Math.trunc(cents));
	const whole = Math.floor(safe / 100);
	const fraction = safe % 100;
	if (fraction === 0) return String(whole);
	return `${whole}.${String(fraction).padStart(2, "0")}`;
}

function wholeToCents(integer: string, fraction = "00"): number | null {
	if (!/^\d+$/.test(integer) || !/^\d{2}$/.test(fraction)) return null;
	const cents = Number(integer) * 100 + Number(fraction);
	if (!Number.isSafeInteger(cents)) return null;
	return cents;
}
