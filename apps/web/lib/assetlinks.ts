const SHA256_COLON_HEX = /^[0-9a-f]{2}(?::[0-9a-f]{2}){31}$/i;

export const ASSETLINKS_RELATIONS = [
	"delegate_permission/common.handle_all_urls",
	"delegate_permission/common.get_login_creds",
] as const;

export type AssetLinksStatement = {
	relation: string[];
	target: {
		namespace: "android_app";
		package_name: string;
		sha256_cert_fingerprints: string[];
	};
};

/**
 * Digital Asset Links del paquete Android.
 *
 * Devuelve `null` si falta el paquete o no hay fingerprints SHA-256 válidos
 * (hex de 32 bytes con dos puntos). Un `[]` sería un documento válido que
 * declara cero apps; Google puede cachearlo como “este host no asocia ninguna
 * app”. El route responde 404 para que la falta de env se note.
 */
export function buildAssetLinks(input: {
	packageName: string | undefined;
	fingerprints: string | undefined;
}): AssetLinksStatement[] | null {
	const packageName = input.packageName?.trim() ?? "";
	if (!packageName) return null;

	const fingerprints = (input.fingerprints ?? "")
		.split(",")
		.map((value) => value.trim())
		.filter((value) => SHA256_COLON_HEX.test(value));
	if (fingerprints.length === 0) return null;

	return [
		{
			relation: [...ASSETLINKS_RELATIONS],
			target: {
				namespace: "android_app",
				package_name: packageName,
				sha256_cert_fingerprints: fingerprints,
			},
		},
	];
}
