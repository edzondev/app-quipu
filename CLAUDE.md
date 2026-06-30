# CLAUDE.md

Repo-specific guidance for Claude Code sessions in **app-quipu** (Quipu 2.0 monorepo). The companion to `AGENTS.md` — read that one first; this file expands the architecture and Convex file map.

## Monorepo shape

pnpm workspace + Turborepo. Workspaces declared in `pnpm-workspace.yaml`:

| Path | Package | Role |
|---|---|---|
| `apps/web` | `@quipu/web` | Next.js 16 frontend (App Router) |
| `packages/convex` | `@quipu/convex` | Convex backend: schema, functions, Better Auth component, Polar webhooks |
| `packages/auth` | `@quipu/auth` | Shared Better Auth config (server-side factory) — placeholder for v2.0 |
| `packages/ui` | `@quipu/ui` | Design-system primitives (hand-rolled, not shadcn yet) — placeholder |
| `packages/lib` | `@quipu/lib` | Shared TypeScript utilities (cn, formatters) — placeholder |
| `packages/config` | `@quipu/config` | Shared `tsconfig` presets (`next.json`, `convex.json`) |

`apps/mobile` is reserved (`pnpm-workspace.yaml`) but the folder does not exist yet. `AGENTS.md` covers the conventions; this file is the architecture map.

## Commands

All orchestrated by Turborepo from the root:

```bash
pnpm dev               # turbo dev — runs all dev tasks in parallel
pnpm run build         # turbo build
pnpm run lint          # turbo lint — biome check
pnpm run format        # turbo format — biome format --write
pnpm run check-types   # turbo check-types — tsc --noEmit per package
pnpm test              # vitest
pnpm run test:e2e      # Playwright
npx convex dev         # from packages/convex/ — backend watcher (NOT orchestrated by turbo)
npx convex codegen     # from packages/convex/ — regenerate _generated/
```

For local dev you always need **both** `pnpm dev` and `npx convex dev` running. The Next.js app will hang on any `useQuery` if the Convex backend is not reachable.

## Auth flow (Better Auth as a Convex component)

Better Auth is not a separate Node service — it runs inside Convex as a locally-mounted component. The flow:

```
Browser                      Next.js (apps/web)            Convex (packages/convex)
  │                                  │                              │
  │ POST /api/auth/sign-in/email      │                              │
  │ (cookies attach) ─────────────────>                              │
  │                                  │ proxy: app/api/auth/[...all]  │
  │                                  │   → handler.POST              │
  │                                  │   → fetch to NEXT_PUBLIC_     │
  │                                  │     CONVEX_SITE_URL/api/      │
  │                                  │     auth/sign-in/email        │
  │                                  │ ─────────────────────────────>│
  │                                  │                              │ betterAuth routes
  │                                  │                              │ (sign-in, sign-up, passkey)
  │                                  │ <─────────────────────────────│ (set-cookie)
  │ <────────────────────────────────│                               
  │                                                                  
  │ ConvexReactClient opens WS                                         
  │ ─────────────────────────────────────────────────────────────────>│ Convex server
                                                                          uses getAuthUserId(ctx)
                                                                          via authConfig provider
                                                                          to verify JWT in cookie
```

Files:

- `packages/convex/convex/betterAuth/` — local install of the Better Auth component. Has its own `convex.config.ts` (what `defineApp().use(betterAuth)` points to) and its own `_generated/`. Do not run `pnpm add better-auth` inside this folder.
- `packages/convex/convex/auth.ts` — top-level `createAuth()` instance with passkey + email+password + account-linking plugins. Used by `http.ts` to mount routes.
- `packages/convex/convex/auth.config.ts` — `{ providers: [getAuthConfigProvider()] } satisfies AuthConfig`. Tells the Convex server how to validate JWTs.
- `packages/convex/convex/http.ts` — Convex HTTP router. Registers Better Auth routes at `/api/auth/*` and the Polar webhook at `/webhooks/polar`.
- `apps/web/lib/auth-client.ts` — browser `authClient` from `createAuthClient` with `convexClient()` and `passkeyClient()` plugins. `baseURL = NEXT_PUBLIC_SITE_URL` (not the Convex URL — avoids CORS).
- `apps/web/lib/auth-server.ts` — `convexBetterAuthNextJs()` destructured to `handler`, `getToken`, `isAuthenticated`, `preloadAuthQuery`, `fetchAuthQuery`, `fetchAuthMutation`, `fetchAuthAction`.
- `apps/web/app/api/auth/[...all]/route.ts` — re-exports `handler.GET` / `handler.POST`. Next.js acts as a proxy so the browser never makes a cross-origin request to Convex.
- `apps/web/app/layout.tsx` — async server component. Calls `getToken()` (which reads the auth cookie via `next/headers` and fetches the JWT from Convex) and passes the result as `initialToken` to `ConvexClientProvider`. **Required** to avoid hydration flicker on the first client render.
- `apps/web/core/components/providers/ConvexClientProvider.tsx` — wraps `ConvexBetterAuthProvider` around the app. The `authClient as unknown as AuthClient` cast is a workaround for a known type bug in `@convex-dev/better-auth@0.12.4`.

## Convex backend file map

| File | Purpose |
|---|---|
| `convex/schema.ts` | All app tables: `profiles`, `financialCycles`, `envelopes`, `subEnvelopes`, `fixedCommitments`, `expenses`, `coachInteractions`, `streaks`, `cycleHistory`, `adHocIncomes` |
| `convex/profiles.ts` | `getMyProfile`, `createProfile`, `completeOnboarding`, `updateProfile` |
| `convex/paydayEngine.ts` | `processPayday`, `registerAdHocIncome`, `deleteAdHocIncome` — payday flow |
| `convex/expenses.ts` | `registerExpense`, `updateExpense`, `deleteExpense`, `listExpenses`, `getMonthlyTotals` — free plan caps at 20/mes |
| `convex/fixedCommitments.ts` | CRUD for fixed monthly commitments (premium-only) |
| `convex/coachEngine.ts` | `WANTS_OVERFLOW_60` nudge + rescue / freeze options — coach context |
| `convex/lib/budgetMath.ts` | Pure functions: largest-remainder allocation, cycle compliance, rescue transfer, pay-frequency math |
| `convex/auth.ts` | Better Auth factory (passkey + email/password + account linking + convex plugin) |
| `convex/auth.config.ts` | Convex auth provider config |
| `convex/http.ts` | HTTP router — mounts Better Auth routes + Polar webhook |
| `convex/convex.config.ts` | `defineApp().use(betterAuth)` registers the auth component |
| `convex/_generated/` | Auto-generated by `npx convex codegen`. Do not edit. |
| `convex/betterAuth/` | Local install of the Better Auth component. Has its own `_generated/`. |
| `convex/index.ts` | Re-exports public queries/mutations. Acts as a thin barrel. |

All Convex functions use types from `convex/_generated/` (`Doc`, `Id`, `api`).

## Frontend structure (`apps/web`)

```
apps/web/
  app/
    layout.tsx              # root layout, async, calls getToken(), wraps in ConvexClientProvider
    page.tsx                # default create-next-app landing (to be replaced)
    api/auth/[...all]/route.ts
    (auth)/                 # route group — login, register, onboarding (planned)
    (dashboard)/            # route group — protected screens (planned)
    (legal)/                # route group — MDX legal pages (planned)
    (upgrade)/              # route group — premium upgrade (planned)
  core/
    components/
      providers/ConvexClientProvider.tsx
      ui/                   # hand-rolled design-system primitives
  modules/                  # feature modules (vertical slice) — empty, created when UI lands
    auth/
    dashboard/
    expenses/
    payday/
    rescue/
    savings/
    settings/
    landing/
  lib/
    auth-client.ts
    auth-server.ts
    utils.ts                # cn() helper, formatters
  next.config.ts            # reactCompiler: true, optimizePackageImports
  tsconfig.json             # extends @quipu/config/tsconfig/next.json
```

Cross-cutting hooks (e.g. `useIsPremium`) will live in `apps/web/hooks/` at the package root, not under any `modules/` feature.

## Conventions

- **Package manager**: pnpm 11. Lockfile is `pnpm-lock.yaml`. Never commit a `package-lock.json`, `yarn.lock`, or `bun.lockb`.
- **Node**: 24.15.0 (see `.nvmrc`).
- **Linter / formatter**: Biome (not ESLint / Prettier). 2-space indent, no semicolons, double quotes. `biome.json` enables `next` and `react` domain rules and `organizeImports` on save.
- **React Compiler** is on — do NOT add manual `useMemo` / `useCallback` / `React.memo` unless the compiler cannot prove safety. The babel plugin handles it.
- **Tailwind v4** with `@theme inline` block in `app/globals.css`. Color tokens are OKLCH.
- **shadcn/ui** is not installed yet. When added, components land at `@/core/components/ui` (not the default `components/ui/`). The `components.json` will declare the alias.
- **Feature modules** (planned): each `modules/<feature>/` will contain `components/`, `hooks/`, `schemas/`. Cross-cutting hooks in `apps/web/hooks/`.
- **Catalog**: any dep used by ≥2 packages goes into `pnpm-workspace.yaml` `catalog:`. Reference it with `"name": "catalog:"` in package.json. Single-use deps stay in the consuming package.
- **env vars split**: see `AGENTS.md` § "Convex gotchas — env vars split" and `.env.example`. Short version: `NEXT_PUBLIC_*` lives in Next.js; everything else (Polar, Better Auth, passkey) is Convex-side and goes through `npx convex env set` in production.
- **Server-rendered auth**: `app/layout.tsx` is `async`, calls `getToken()`, and passes the result as `initialToken` to `ConvexClientProvider`. Do not move this — removing it causes a hydration flicker between unauthenticated and authenticated states.

## Environment variables

See `.env.example` for the full template with comments. The canonical names the code reads:

- **Next.js (`.env.local`)**: `NEXT_PUBLIC_CONVEX_URL`, `NEXT_PUBLIC_CONVEX_SITE_URL`, `SITE_URL`, plus all the `NEXT_PUBLIC_*` for PostHog / Sentry. `BETTER_AUTH_URL`, `VERCEL_URL`, and `NEXT_PUBLIC_SITE_URL` are accepted as fallbacks for `SITE_URL` if you want to mirror across runtimes.
- **Convex (dashboard or `npx convex env set`)**: `BETTER_AUTH_SECRET`, `POLAR_ORGANIZATION_TOKEN`, `POLAR_WEBHOOK_SECRET`, `POLAR_SERVER`, `POLAR_PRODUCT_ID_PREMIUM`, `PASSKEY_RP_ID`, `PASSKEY_RP_NAME`. Convex also reads `SITE_URL` to use as Better Auth's `baseURL`.
- **E2E (Playwright, `.env.local`)**: `E2E_TEST_EMAIL`, `E2E_TEST_PASSWORD` — never production.

`POLAR_ACCESS_TOKEN` and `BETTER_AUTH_URL` are NOT referenced in the code (they were v1 names). The runtime has fallbacks for them, but new code should not introduce them.
