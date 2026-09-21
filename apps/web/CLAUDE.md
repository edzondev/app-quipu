# AGENTS.md — Contexto para agentes de IA

> Este archivo es leído por herramientas como Zed, Claude Code, Cursor, etc.
> Su gemelo `CLAUDE.md` se mantiene idéntico por compatibilidad.
> El bloque entre `convex-ai-start` / `convex-ai-end` es administrado por
> `npx convex ai-files install` y **no debe modificarse manualmente**.

---

<!-- convex-ai-start -->

This project uses [Convex](https://convex.dev) as its backend.

When working on Convex code, **always read
`convex/_generated/ai/guidelines.md` first** for important guidelines on
how to correctly use Convex APIs and patterns. The file contains rules that
override what you may have learned about Convex from training data.

Convex agent skills for common tasks can be installed by running
`npx convex ai-files install`.

<!-- convex-ai-end -->

---

## Única fuente de verdad: `docs/QUIPU-MASTER.md`

**Lee `docs/QUIPU-MASTER.md` antes de cualquier tarea.** Es el documento maestro
del proyecto: producto, diseño (canon v3.0), arquitectura, backend, estándares de
código, flujo de trabajo con IA (skills + gstack), estado actual, roadmap y operación.

Puntos de entrada según la tarea:

| Necesito... | Sección del maestro |
|---|---|
| Contexto del proyecto y reglas | Leer completo una vez |
| Empezar una tarea nueva | §8 Estado y roadmap (qué falta, estados reales) |
| Escribir o revisar código | §4 Arquitectura + §6 Estándares |
| Tocar UI | §3 Diseño (canon, tokens, bloques) |
| Tocar `convex/` | §5 Backend + `convex/_generated/ai/guidelines.md` |
| Saber qué skills usar | §7 Flujo de trabajo con IA |
| Comandos, smoke tests, pre-commit | §9 Operación |

**Reglas que no se repiten aquí a propósito** (viven solo en el maestro):
skills obligatorias (`caveman`/`ponytail` siempre activos), gstack, estructura de
carpetas, decisiones técnicas, convenciones y pendientes.

Si algo contradice al maestro, gana el maestro (o se actualiza explícitamente allí).

---

## Cursor Cloud specific instructions

Notas no obvias para agentes en la VM de Cursor Cloud. Comandos estándar
(dev, lint, test, build) viven en `README.md` y `docs/QUIPU-MASTER.md` §9.

- **Instalar deps:** `pnpm install` (Node 22 + pnpm 10 vía Corepack ya presentes).
  El script de arranque del entorno ya lo corre.
- **`.env.local` no existe en el repo.** Copiar `apps/web/.env.example` a
  `apps/web/.env.local`. El front no arranca sin las URLs públicas porque
  `core/env*.ts` valida env en build. Para dev local:
  `CONVEX_AGENT_MODE=anonymous npx convex dev` crea un backend Convex **local
  anónimo** (sin cuenta) y escribe `CONVEX_DEPLOYMENT` + `NEXT_PUBLIC_CONVEX_URL`
  + `NEXT_PUBLIC_CONVEX_SITE_URL` en `.env.local`. Completar a mano lo que falte:
  `BETTER_AUTH_SECRET` (≥32 chars), `SITE_URL`, `NEXT_PUBLIC_APP_URL`,
  `POLAR_PRODUCT_ID_PREMIUM` (placeholder), `POLAR_SERVER=sandbox`, y las dummy
  keys de Turnstile (`NEXT_PUBLIC_TURNSTILE_SITE_KEY` + `TURNSTILE_SECRET_KEY`).
  El backend Convex lee `BETTER_AUTH_SECRET` y `SITE_URL` de su propio env:
  `npx convex env set BETTER_AUTH_SECRET <...>` / `... SITE_URL http://localhost:3000`.
- **Convex typecheck falla con `Cannot find name 'process'`** al hacer `convex dev`:
  el runtime de Convex sí expone `process.env`, pero `convex/tsconfig.json` no
  incluye tipos de Node. Para pushear funciones al backend local usa
  `npx convex dev --typecheck disable`. No es un error de código.
- **Deployment local anónimo se llama `anonymous:...`**, no `dev:...`. Por eso
  `convex/testing.ts:setMyPlan` (guard `CONVEX_DEPLOYMENT` empieza con `dev:`) no
  corre en local; el smoke de rescate premium no se puede ejercitar contra el
  backend local anónimo.
- **Alcance de agentes CI/CD-front:** ajustes de CI/CD, estilos y frontend no
  requieren tocar lógica de Convex; para eso basta `pnpm dev` (+ Convex local si
  se necesita datos). Levantar Convex en la nube está fuera de ese alcance.

<!-- CODEGRAPH_START -->
## CodeGraph

Este repo tiene **dos índices** (ambos gitignored):

| Ámbito | Directorio | Cuándo usarlo |
|---|---|---|
| Proyecto (Next + modules) | `.codegraph/` en la raíz | UI, routing, wrappers, shared |
| Convex (backend) | `convex/.codegraph/` | queries, mutations, schema, `convex/lib/*` |

Antes de grep/find o leer archivos sueltos, usa CodeGraph:

- **MCP:** `codegraph_explore` (proyecto) o `codegraph-convex` → `codegraph_explore` (backend). Devuelve source verbatim + call paths, incluyendo dispatch dinámico.
- **Shell:** `codegraph explore "<query>"` (raíz) · `codegraph explore "<query>" --path convex` (backend).
- **Sync tras cambios grandes:** `pnpm codegraph:sync` y/o `pnpm codegraph:sync:convex`.

Si falta el índice del ámbito que necesitas: `codegraph init` (raíz) o `codegraph init convex`.
<!-- CODEGRAPH_END -->
