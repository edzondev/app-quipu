/**
 * Lectura de variables de entorno en Convex (mismo archivo que corre en el runtime Convex).
 * Nombres canónicos según `.env.example`; alias antiguos como respaldo.
 */

function trim(s: string | undefined): string | undefined {
  const t = s?.trim();
  return t || undefined;
}

/** baseURL de Better Auth: SITE_URL o alias BETTER_AUTH_URL. */
export function getSiteUrl(): string | undefined {
  return trim(process.env.SITE_URL) ?? trim(process.env.BETTER_AUTH_URL);
}

/**
 * Token de organización Polar para el SDK.
 * Preferir POLAR_ORGANIZATION_TOKEN; POLAR_ACCESS_TOKEN es alias heredado (docs antiguas).
 */
export function getPolarOrganizationToken(): string | undefined {
  return (
    trim(process.env.POLAR_ORGANIZATION_TOKEN) ??
    trim(process.env.POLAR_ACCESS_TOKEN)
  );
}

/** Lanza si falta el token Polar (acciones que llaman a la API Polar). */
export function requirePolarOrganizationToken(): string {
  const t = getPolarOrganizationToken();
  if (!t) {
    throw new Error(
      "Configura POLAR_ORGANIZATION_TOKEN (o el alias heredado POLAR_ACCESS_TOKEN) en el entorno de Convex.",
    );
  }
  return t;
}

export function getPolarProductIdPremium(): string | undefined {
  return trim(process.env.POLAR_PRODUCT_ID_PREMIUM);
}
