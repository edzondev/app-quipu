# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
bun dev          # Start Next.js dev server
bun run build    # Production build
bun run lint     # Biome check (linting)
bun run format   # Biome format --write (auto-format)
npx convex dev   # Start Convex dev server (run alongside bun dev)

# E2E tests (requires dev server running on port 3000)
bun run test:e2e        # Run Playwright tests headless
bun run test:e2e:ui     # Run with Playwright UI
npx playwright test e2e/expenses.spec.ts  # Run a single spec file
```

## Architecture

Quipu is a personal finance app (budget envelopes, expense tracking, savings goals, couple mode) for the Peruvian market. Built with **Next.js 16 App Router** + **Convex** as the real-time backend.

**Core flow**: User receives salary → Quipu splits it into three envelopes (Needs 50%, Wants 30%, Savings 20%) on payday → user registers expenses against envelopes → rescue mode activates when an envelope goes negative.

### Auth: Better Auth + Convex

Auth is handled by `@convex-dev/better-auth`, which bridges Better Auth with Convex:

- **`lib/auth-client.ts`** — client-side `authClient` (used in React components)
- **`lib/auth-server.ts`** — server-side helpers: `getToken`, `isAuthenticated`, `handler` (route handler), `preloadAuthQuery`, `fetchAuth*`
- **`app/api/auth/[...all]/route.ts`** — Better Auth Next.js handler
- **`convex/betterAuth/auth.ts`** — defines `authComponent` (Convex client) and `createAuth` factory
- **`convex/http.ts`** — Convex HTTP router; registers Better Auth routes + Polar webhook (`/webhooks/polar`)
- **`convex/auth.config.ts`** — Convex auth provider config

The root layout (`app/layout.tsx`) fetches the JWT token server-side via `getToken()` and passes it as `initialToken` to `ConvexBetterAuthProvider` to avoid hydration flicker.

### Convex Backend

- **`convex/schema.ts`** — full DB schema: `profiles`, `expenses`, `fixedCommitments`, `specialIncomes`, `savingsSubEnvelopes`, `savingsGoals`, `coachMessages`, `achievements`, `streaks`, `streakMonthlyHistory`
- **`convex/helpers.ts`** — shared auth utilities: `getProfile`, `getProfileOrThrow`, `getAuthUserIdOrThrow`, `requirePremium`, `computeEnvelopes`, `currentMonthString`
- **`convex/envelopes.ts`** — `getEnvelopes` (lightweight envelope picker with balances; excludes savings)
- **`convex/expenses.ts`** — `listExpenses` (paginated), `getMonthlyTotals`, `getCurrentMonthCount`, `registerExpense`, `updateExpense`, `deleteExpense`
- **`convex/payday.ts`** — `getDashboardData` (aggregate query), `processPayday`
- **`convex/rescue.ts`** — `getRescueStatus`, `applyRescue` (premium: handles negative envelope overflow)
- **`convex/savings.ts`** — `getSavingsSubEnvelopes`, `getSavingsGoals`, `distributeSavings`, `withdrawFromEmergencyFund`, savings goal CRUD
- **`convex/fixedCommitments.ts`** — CRUD for fixed monthly commitments (premium)
- **`convex/specialIncomes.ts`** — `listSpecialIncomes`, `checkIfExtraordinary`, `registerSpecialIncome` (premium)
- **`convex/streaks.ts`** — `getStreakData`, `getAchievements`, `evaluateMonthCompliance` (internal, scheduled)
- **`convex/coach.ts`** — `getUnreadCoachMessages`, `markCoachMessageRead`, `createCoachMessage` (internal)
- **`convex/subscriptions.ts`** — `getMyPlan`, `activatePremium`, `revokePremium`, `linkPolarCustomer`
- **`convex/profiles.ts`** — `getMyProfile`, `createProfile`, `completeOnboarding`, `updateProfile`
- All Convex queries/mutations use types from `convex/_generated/`

### Frontend Structure

```
app/
  (auth)/           # Login & register pages
  (dashboard)/
    (routes)/       # achievements, add-expense, dashboard, expenses,
                    # payday, plan, profile, register-income, rescue,
                    # savings, settings, success
  (legal)/          # Terms & privacy pages (MDX)
  (upgrade)/        # Subscription/upgrade pages
  api/auth/         # Better Auth route handler

core/
  components/
    ui/             # shadcn/ui components (aliased as @/core/components/ui)
    providers/      # ConvexBetterAuthProvider wrapper

modules/            # Feature modules (vertical slice pattern)
  auth/             # components/, hooks/, schemas/
  dashboard/        # Sidebar, nav items, header, envelope cards
  expenses/         # Register, list, edit, delete expense components
  payday/           # Payday flow (income input, assignment steps)
  rescue/           # Rescue mode flow
  savings/          # Savings goals and sub-envelopes
  settings/         # Fixed commitments, profile settings
  landing/          # Marketing landing page components

lib/
  auth-client.ts
  auth-server.ts
  utils.ts          # cn() helper (clsx + tailwind-merge)

e2e/                # Playwright E2E tests
  helpers/auth.ts   # loginAs() helper and TEST_USER credentials
```

### Key Conventions

- **Package manager**: `bun` (use `bun` not `npm`/`pnpm`)
- **Linter/formatter**: Biome (not ESLint/Prettier) — 2-space indentation
- **shadcn/ui**: aliased to `@/core/components/ui` (not the default `components/ui/`). Add components with `npx shadcn add <component>`.
- **Feature modules** follow vertical slice: each module under `modules/<feature>/` contains its own `components/`, `hooks/`, `schemas/`
- **React Compiler** is enabled — avoid manual `useMemo`/`useCallback` unless strictly necessary
- **Tailwind CSS v4** with CSS variables for theming (`app/globals.css`)
- **Fonts**: DM Sans (`--font-dm-sans`) and Space Grotesk (`--font-space-grotesk`)
- **MDX**: Legal pages use MDX (`pageExtensions` includes `.mdx`)
- **Monitoring**: Sentry for errors (`instrumentation.ts`, `sentry.*.config.ts`), PostHog for analytics
- **Subscriptions**: Polar.sh handles payments; webhook at `/webhooks/polar` in `convex/http.ts`
- **Premium gate**: use `requirePremium(profile)` in Convex mutations; free plan has no `fixedCommitments`, rescue mode, special incomes, or couple mode

### Required Environment Variables

See `.env.example` for the full template and Convex vs Next.js split.

```
NEXT_PUBLIC_CONVEX_URL
NEXT_PUBLIC_CONVEX_SITE_URL
SITE_URL                 # canonical app URL; Better Auth in Convex uses this as baseURL
BETTER_AUTH_SECRET       # Convex (Better Auth)
POLAR_ORGANIZATION_TOKEN # Convex — Polar SDK (not POLAR_ACCESS_TOKEN)
POLAR_WEBHOOK_SECRET
POLAR_SERVER             # "sandbox" | "production"
POLAR_PRODUCT_ID_PREMIUM
RESEND_API_KEY           # if using email
NEXT_PUBLIC_POSTHOG_KEY
NEXT_PUBLIC_POSTHOG_HOST
SENTRY_DSN               # server/edge; optional in dev
NEXT_PUBLIC_SENTRY_DSN   # client; optional in dev
SENTRY_AUTH_TOKEN        # optional; source maps upload
E2E_TEST_EMAIL           # Playwright only
E2E_TEST_PASSWORD
```

`BETTER_AUTH_URL` is not referenced in app TypeScript; Convex `createAuthOptions` uses `SITE_URL` as `baseURL`.
