/**
 * Resolución de variables de entorno para Next.js.
 * Nombres canónicos según `.env.example`; se aceptan alias antiguos como respaldo.
 */

function trim(s: string | undefined): string | undefined {
  const t = s?.trim();
  return t || undefined;
}

/** URL del despliegue Convex (HTTP API). Requerida en cliente y servidor. */
export function getConvexUrl(): string {
  const v = trim(process.env.NEXT_PUBLIC_CONVEX_URL);
  if (!v) {
    throw new Error(
      "Falta NEXT_PUBLIC_CONVEX_URL. Copia .env.example a .env.local y configura Convex.",
    );
  }
  return v;
}

/** URL del sitio Convex (.convex.site) para el puente Better Auth. */
export function getConvexSiteUrl(): string {
  const v = trim(process.env.NEXT_PUBLIC_CONVEX_SITE_URL);
  if (!v) {
    throw new Error(
      "Falta NEXT_PUBLIC_CONVEX_SITE_URL. Debe coincidir con el .convex.site de tu proyecto.",
    );
  }
  return v;
}

/**
 * URL pública absoluta de la app (sin barra final).
 * Orden: SITE_URL → BETTER_AUTH_URL (alias documentación) → VERCEL_URL → NEXT_PUBLIC_SITE_URL (obsoleto).
 */
export function getSiteUrl(): string | undefined {
  return (
    trim(process.env.SITE_URL) ??
    trim(process.env.BETTER_AUTH_URL) ??
    (trim(process.env.VERCEL_URL)
      ? `https://${trim(process.env.VERCEL_URL)}`
      : undefined) ??
    trim(process.env.NEXT_PUBLIC_SITE_URL)
  );
}

/**
 * Clave de proyecto PostHog (navegador).
 * Preferir NEXT_PUBLIC_POSTHOG_KEY; NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN es alias heredado.
 */
export function getPosthogKey(): string | undefined {
  return trim(process.env.NEXT_PUBLIC_POSTHOG_KEY) ?? trim(
    process.env.NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN,
  );
}

/** Host de la API PostHog; por defecto US cloud. */
export function getPosthogHost(): string {
  return trim(process.env.NEXT_PUBLIC_POSTHOG_HOST) ?? "https://us.i.posthog.com";
}
