# `@quipu/web`

Next.js 16 frontend for Quipu. Lives inside the [monorepo](../../).

## Local dev

Two processes — the Next.js server alone is not enough. Convex is the source
of truth for auth and data, and the client connects to it directly.

```bash
pnpm dev               # terminal 1 — Next.js on :3000
npx convex dev         # terminal 2 — run from packages/convex/
```

`npx convex dev` syncs env vars from `.env.local` to your Convex deployment
and generates `packages/convex/convex/_generated/`. It must be running
alongside the web app or any `useQuery` / `useMutation` will hang.

## Stack

- Next.js 16 (App Router, React Compiler, cacheComponents)
- React 19
- Tailwind v4
- Convex (real-time client + Better Auth)
- Better Auth (`@convex-dev/better-auth` as the Convex component)

See the root [`AGENTS.md`](../../AGENTS.md) and [`CLAUDE.md`](../../CLAUDE.md)
for env-var split, monorepo commands, Convex gotchas, and module conventions.
