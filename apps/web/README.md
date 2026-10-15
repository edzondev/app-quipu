# app-quipu

Repositorio de **Quipu v2** — app web de finanzas personales para Perú (PEN, español). El producto responde: *¿cuánto puedo gastar hoy sin destruir mi mes?* Divide el dinero en tres sobres (Necesidades / Gustos / Ahorro) antes de gastarlo.

**Estado:** desarrollo activo. Bloques 1–5 implementados (auth, onboarding, dashboard, gastos, ingresos).

---

## Inicio rápido

Comandos del monorepo: [`SCRIPTS.md`](../../SCRIPTS.md). Node `>=24` y pnpm `12.10.1` están en el `package.json` de la raíz.

Copia `apps/web/.env.example` a `apps/web/.env.local`. `apps/web/core/env.client.ts` valida `NEXT_PUBLIC_APP_URL`, `NEXT_PUBLIC_CONVEX_URL` y `NEXT_PUBLIC_CONVEX_SITE_URL`.

---

## Variables de entorno

`apps/web/.env.local` no se commitea. El listado está en `apps/web/.env.example`.

En `apps/web/core/env.client.ts`, `NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN`, `NEXT_PUBLIC_POSTHOG_HOST` y `NEXT_PUBLIC_TURNSTILE_SITE_KEY` son opcionales. Las tres URLs del inicio rápido son obligatorias.

---

## Stack

| Capa | Tecnología |
|------|------------|
| Frontend | Next.js 16 (App Router) · React 19 · Tailwind v4 |
| Backend | Convex (queries, mutations, schema) |
| Auth | Better Auth + passkey |
| Forms | TanStack Form + Zod |
| UI | shadcn/ui sobre Base UI |
| Calidad | Biome · Vitest |

---

## Estructura del repo

```
app/
  (auth)/          sign-in, sign-up
  (onboarding)/    wizard de configuración inicial
  (app)/           dashboard, income/register
auth/              Better Auth (client, server, sesión)
convex/            backend: schema, queries, mutations, lib/
core/              env, errores tipados, constantes
modules/           un directorio por dominio funcional
  auth/ onboarding/ dashboard/ expenses/ income/ coach/ savings/
shared/            UI primitivos, layout, helpers (money, date)
```

**Reglas de arquitectura** (resumen):

- Lógica de negocio en `convex/`, no en componentes React.
- `app/` solo enruta y compone; sin lógica de dominio.
- Cada módulo: `components/`, `actions.ts`, `schemas.ts`, `types.ts`, `lib/`.
- Tipos de datos desde `convex/_generated/dataModel`; no duplicar a mano.
- Dinero en céntimos (`shared/lib/money.ts`); fechas en `America/Lima` (`shared/lib/date.ts`).

---

## Comandos

```bash
pnpm dev              # Next.js dev server
npx convex dev        # Convex backend (regenera tipos)
pnpm typecheck        # TypeScript (0 errores)
pnpm lint             # Biome check
pnpm lint:fix         # Biome auto-fix
pnpm test             # Vitest (unitarios)
npx convex dashboard  # UI de Convex
```

El cheatsheet del monorepo (raíz, filtros, móvil) está en [`SCRIPTS.md`](../../SCRIPTS.md).

### Antes de commit / PR

1. `pnpm typecheck` sin errores.
2. `pnpm lint` sin warnings nuevos.
3. Si tocaste `convex/schema.ts` → regenerar tipos y commitear `convex/_generated/`.
4. Nueva variable pública del cliente → `apps/web/core/env.client.ts`.
5. Nuevo error de dominio → enum en `core/errors/`.

---

## Documentación

| Documento | Para qué |
|-----------|----------|
| [`SCRIPTS.md`](../../SCRIPTS.md) | Comandos del monorepo |
| [`AGENTS.md`](AGENTS.md) / [`CLAUDE.md`](CLAUDE.md) | Contexto para agentes de IA y herramientas |

`convex/_generated/ai/guidelines.md` no está en git. Existe solo después de `npx convex ai-files install`.

---

## CI

Push y pull request a `master` corren [`.github/workflows/ci.yml`](../../.github/workflows/ci.yml): `pnpm ci:quality`, `pnpm typecheck:ci`, `pnpm test:mobile` y `pnpm test:web`.

---

## Troubleshooting

| Problema | Qué revisar |
|----------|-------------|
| Build falla por env | `apps/web/.env.local` y `apps/web/core/env.client.ts` |
| Tipos de Convex desactualizados | Correr `npx convex dev` y commitear `_generated/` |
| Auth no funciona | `BETTER_AUTH_SECRET` (≥32 chars) y URLs de Convex correctas |

---

## Licencia

Proyecto privado. Sin licencia pública definida.
