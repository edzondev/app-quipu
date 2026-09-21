# app-quipu

Repositorio de **Quipu v2** — app web de finanzas personales para Perú (PEN, español). El producto responde: *¿cuánto puedo gastar hoy sin destruir mi mes?* Divide el dinero en tres sobres (Necesidades / Gustos / Ahorro) antes de gastarlo.

**Estado:** desarrollo activo. Bloques 1–5 implementados (auth, onboarding, dashboard, gastos, ingresos). Detalle en [`docs/QUIPU-MASTER.md` §8](docs/QUIPU-MASTER.md).

---

## Inicio rápido

**Requisitos:** Node.js 20+, [pnpm](https://pnpm.io/), cuenta en [Convex](https://convex.dev).

```bash
pnpm install
cp .env.example .env.local   # si existe; si no, crear .env.local (ver abajo)
npx convex dev               # terminal 1
pnpm dev                     # terminal 2 → http://localhost:3000
```

**Verificar que funciona:**

```bash
pnpm typecheck
pnpm test
```

---

## Variables de entorno

Crear `.env.local` en la raíz (no se commitea):

```env
NEXT_PUBLIC_CONVEX_URL=https://<tu-deployment>.convex.cloud
NEXT_PUBLIC_CONVEX_SITE_URL=https://<tu-deployment>.convex.site
NEXT_PUBLIC_APP_URL=http://localhost:3000
BETTER_AUTH_SECRET=<mínimo 32 caracteres aleatorios>
# Cloudflare Turnstile dummy keys (local). Do not skip verification via NODE_ENV.
NEXT_PUBLIC_TURNSTILE_SITE_KEY=1x00000000000000000000AA
TURNSTILE_SECRET_KEY=1x0000000000000000000000000000000AA
```

Todas las variables se validan en build vía [`core/env.ts`](core/env.ts). Las que empiezan con `NEXT_PUBLIC_` son públicas en el bundle.

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
docs/              documentación del proyecto
```

**Reglas de arquitectura** (resumen):

- Lógica de negocio en `convex/`, no en componentes React.
- `app/` solo enruta y compone; sin lógica de dominio.
- Cada módulo: `components/`, `actions.ts`, `schemas.ts`, `types.ts`, `lib/`.
- Tipos de datos desde `convex/_generated/dataModel`; no duplicar a mano.
- Dinero en céntimos (`shared/lib/money.ts`); fechas en `America/Lima` (`shared/lib/date.ts`).

Detalle completo: [`docs/QUIPU-MASTER.md` §4–§6](docs/QUIPU-MASTER.md).

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

### Antes de commit / PR

1. `pnpm typecheck` sin errores.
2. `pnpm lint` sin warnings nuevos.
3. Si tocaste `convex/schema.ts` → regenerar tipos y commitear `convex/_generated/`.
4. Nueva env var → agregar en `core/env.ts` con Zod.
5. Nuevo error de dominio → enum en `core/errors/`.
6. Actualizar [`docs/QUIPU-MASTER.md` §8](docs/QUIPU-MASTER.md) si cerraste o descubriste trabajo.

---

## Documentación

| Documento | Para qué |
|-----------|----------|
| [`docs/QUIPU-MASTER.md`](docs/QUIPU-MASTER.md) | **Leer primero.** Producto, diseño, arquitectura, backend, estándares, roadmap |
| [`AGENTS.md`](AGENTS.md) / [`CLAUDE.md`](CLAUDE.md) | Contexto para agentes de IA y herramientas |
| [`convex/_generated/ai/guidelines.md`](convex/_generated/ai/guidelines.md) | Reglas de Convex (obligatorio antes de tocar `convex/`) |
| [`docs/manuales-de-sistema.md`](docs/manuales-de-sistema.md) | System prompts de rigor (seguridad, RCA, CI/CD) |
| [`quipu-2.html`](quipu-2.html) | Canvas visual del diseño (9 bloques) |

**Mapa rápido del maestro:**

| Necesito… | Sección |
|-----------|---------|
| Qué falta por construir | §8 Estado y roadmap |
| Escribir o revisar código | §4 Arquitectura + §6 Estándares |
| Tocar UI | §3 Diseño (canon v3.0) |
| Tocar backend | §5 Backend + guidelines de Convex |

---

## Política de branching

Todo el desarrollo va en la rama de trabajo actual. **Nada mergea a `main` hasta que la app esté completa.** Los P0 bloquean el release del producto, no un merge intermedio.

CI: lint, typecheck y Vitest corren en push/PR a `main`/`master` (ver [`.github/workflows/ci.yml`](.github/workflows/ci.yml)).

---

## Troubleshooting

| Problema | Qué revisar |
|----------|-------------|
| Build falla por env | Variables en `.env.local` y esquema en `core/env.ts` |
| Tipos de Convex desactualizados | Correr `npx convex dev` y commitear `_generated/` |
| Auth no funciona | `BETTER_AUTH_SECRET` (≥32 chars) y URLs de Convex correctas |

---

## Licencia

Proyecto privado. Sin licencia pública definida.
