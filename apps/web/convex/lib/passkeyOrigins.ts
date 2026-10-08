const ANDROID_APK_KEY_HASH_PREFIX = "android:apk-key-hash:";

/**
 * `PASSKEY_ANDROID_APK_KEY_HASHES`: base64url del SHA-256 de cada certificado,
 * separados por coma, sin prefijo. Esta función agrega `android:apk-key-hash:`.
 */
export function androidApkKeyHashOrigins(raw: string | undefined): string[] {
	return (raw ?? "")
		.split(",")
		.map((hash) => hash.trim())
		.filter((hash) => hash.length > 0)
		.map((hash) => `${ANDROID_APK_KEY_HASH_PREFIX}${hash}`);
}
