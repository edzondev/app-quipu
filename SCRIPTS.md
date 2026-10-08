# Scripts del monorepo

Cheatsheet rápido. Ejecuta los comandos desde la **raíz del repo** a menos que
se indique otra cosa. `pnpm` resuelve automáticamente el paquete correcto.

## Convex (backend)

| Qué hace | Comando |
|---|---|
| Levantar Convex en watch (regenera `_generated/` + push al dev deployment) | `pnpm --filter @quipu/web convex:dev` |
| Solo regenerar el tipado de web, sin watch | `pnpm --filter @quipu/web exec convex codegen` |
| Regenerar el spec que consume el móvil (`packages/convex-api/src/api.ts`), sin deployment | `pnpm --filter @quipu/web convex:export-api` |
| Deploy a producción | `pnpm --filter @quipu/web exec convex deploy` |

> Importante: todos estos comandos se ejecutan desde `apps/web/` porque ahí
> vive `convex/`. Si los corres desde la raíz, el CLI no encuentra la carpeta.

## Web (Next.js)

| Qué hace | Comando |
|---|---|
| Dev server (http://localhost:3000) | `pnpm --filter @quipu/web dev` |
| Build de producción | `pnpm --filter @quipu/web build` |
| Servir el build localmente | `pnpm --filter @quipu/web start` |
| Typecheck (`convex codegen` + Next typegen + `tsc --noEmit`) | `pnpm --filter @quipu/web typecheck` |
| Tests (Vitest) | `pnpm --filter @quipu/web test` |
| Lint (Biome) | `pnpm --filter @quipu/web lint` |
| Auto-fix de lint | `pnpm --filter @quipu/web lint:fix` |
| Formatear (Biome) | `pnpm --filter @quipu/web format` |
| Verificar formato sin tocar archivos | `pnpm --filter @quipu/web format:check` |
| Lint + format check (CI) | `pnpm --filter @quipu/web ci:quality` |

## Mobile (Expo / React Native)

| Qué hace | Comando |
|---|---|
| Metro con cache limpia + QR para Expo Go | `pnpm --filter @quipu/mobile start` |
| Abrir directamente en Android (requiere emulador/dispositivo) | `pnpm --filter @quipu/mobile android` |
| Abrir directamente en iOS (requiere simulador) | `pnpm --filter @quipu/mobile ios` |
| Expo Web (bundle Metro para navegador) | `pnpm --filter @quipu/mobile web` |
| Regenerar `android/` e `ios/` nativos desde `app.json` | `pnpm --filter @quipu/mobile prebuild` |
| Typecheck (`tsc --noEmit`) | `pnpm --filter @quipu/mobile typecheck` |
| Lint (Biome) | `pnpm --filter @quipu/mobile lint` |
| Auto-fix de lint | `pnpm --filter @quipu/mobile lint:fix` |
| Formatear (Biome) | `pnpm --filter @quipu/mobile format` |
| Verificar formato sin tocar archivos | `pnpm --filter @quipu/mobile format:check` |
| Lint + format check (CI) | `pnpm --filter @quipu/mobile ci:quality` |

## Compartido (`@quipu/convex-api`)

| Qué hace | Comando |
|---|---|
| Regenerar el spec desde `convex/_generated` (sin deployment) | `pnpm --filter @quipu/convex-api generate` |
| Typecheck del paquete | `pnpm --filter @quipu/convex-api typecheck` |

## Raíz (toda la casa)

| Qué hace | Comando |
|---|---|
| Levantar web + mobile en paralelo (Turbo) | `pnpm dev` |
| Build de todo | `pnpm build` |
| Typecheck de todo (Turbo) | `pnpm typecheck` |
| Lint de todo (Turbo) | `pnpm lint` |
| Formatear TODO el repo (Biome, root) | `pnpm format` |
| Biome en modo CI (format + lint, sin escribir) | `pnpm ci:quality` |
| Typecheck de CI (móvil, `@quipu/convex-api`, `apps/web/convex`) | `pnpm typecheck:ci` |
| Jest de `@quipu/mobile` sin watchman | `pnpm test:mobile` |
| Instalar todas las deps del workspace | `pnpm install` |

> `pnpm dev` con Turbo arranca las tareas `dev` declaradas en cada paquete.
> Hoy solo `apps/web` declara `dev` (`next dev`), así que el móvil queda fuera
> de este comando y debe iniciarse por separado con
> `pnpm --filter @quipu/mobile start`.

> `pnpm typecheck` incluye `@quipu/web`, cuyo script corre `convex codegen` y
> necesita un deployment de Convex. El job de GitHub Actions (`.github/workflows/ci.yml`)
> no usa ese comando: corre `pnpm ci:quality`, `pnpm typecheck:ci` y `pnpm test:mobile`.

## Flujo típico de trabajo diario

```bash
# 1. Instalar deps si clonaste el repo por primera vez o cambió pnpm-lock.yaml
pnpm install

# 2. Arrancar Convex (necesario antes de tipar o levantar la web)
pnpm --filter @quipu/web convex:dev

# 3a. Solo web
pnpm --filter @quipu/web dev

# 3b. Solo móvil (en otra terminal)
pnpm --filter @quipu/mobile start

# 4. Cuando cambias funciones de Convex y el móvil necesita el tipado nuevo.
#    No hace falta un deployment: el script lee convex/_generated + el fuente.
pnpm --filter @quipu/web convex:export-api

# 5. Antes de commitear
pnpm typecheck
pnpm lint
```

## Atajos útiles

- `--filter @quipu/web` se puede abreviar a `--filter @quipu/web` con `--filter web`
  si el nombre es único en el workspace.
- `pnpm --filter @quipu/web exec <comando>` ejecuta un bin arbitrario dentro
  del contexto del paquete (ej. `pnpm --filter @quipu/web exec convex logs`).
- `pnpm -r <script>` corre el script en todos los paquetes que lo tengan.
