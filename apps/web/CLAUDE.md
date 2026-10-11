# AGENTS.md — Contexto para agentes de IA

> Este archivo es leído por herramientas como Zed, Claude Code, Cursor, etc.
> Su gemelo `CLAUDE.md` se mantiene idéntico por compatibilidad.
> El bloque entre `convex-ai-start` / `convex-ai-end` es administrado por
> `npx convex ai-files install` y **no debe modificarse manualmente**.

---

<!-- convex-ai-start -->

This project uses [Convex](https://convex.dev) as its backend.

`convex/_generated/ai/guidelines.md` is not committed. It exists only after `npx convex ai-files install`.

<!-- convex-ai-end -->

---

skills obligatorias (`caveman`/`ponytail` siempre activos), gstack

---

## Cursor Cloud specific instructions

Notas no obvias para agentes en la VM de Cursor Cloud. Comandos estándar
(dev, lint, test, build) viven en `README.md` y en `SCRIPTS.md` (raíz del repo).

- **Instalar deps:** `pnpm install` (Node >=24, pnpm 12.10.1; `package.json` en la raíz).
- **`.env.local` no existe en el repo.** Copiar `apps/web/.env.example` a
  `apps/web/.env.local`. El front no arranca sin las URLs públicas porque
  `core/env.client.ts` valida env en build. Para dev local:
  `CONVEX_AGENT_MODE=anonymous npx convex dev` crea un backend Convex **local
  anónimo** (sin cuenta) y escribe `CONVEX_DEPLOYMENT` + `NEXT_PUBLIC_CONVEX_URL`
  + `NEXT_PUBLIC_CONVEX_SITE_URL` en `.env.local`. Completar a mano lo que falte:
  `BETTER_AUTH_SECRET` (≥32 chars), `SITE_URL`, `NEXT_PUBLIC_APP_URL`,
  `POLAR_PRODUCT_ID_PREMIUM` (placeholder), `POLAR_SERVER=sandbox`, y las dummy
  keys de Turnstile (`NEXT_PUBLIC_TURNSTILE_SITE_KEY` + `TURNSTILE_SECRET_KEY`).
  El backend Convex lee `BETTER_AUTH_SECRET` y `SITE_URL` de su propio env:
  `npx convex env set BETTER_AUTH_SECRET <...>` / `... SITE_URL http://localhost:3000`.
- **`setMyPlan`** (`convex/testing.ts`) llama `assertDevCloudOnly(process.env.CONVEX_CLOUD_URL)` y `isDevelopmentDeployment()`.
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

Si falta el índice del ámbito que necesitas: `codegraph init` (raíz) o `codegraph init convex`.
<!-- CODEGRAPH_END -->
