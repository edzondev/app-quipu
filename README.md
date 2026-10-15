# app-quipu

Monorepo pnpm (`pnpm-workspace.yaml`: `apps/*`, `packages/*`).

- `apps/web`
- `apps/mobile`
- `@repo/ts-config` (`packages/typescript-config`)
- `@quipu/convex-api` (`packages/convex-api`)

Biome (`biome.json`) hace lint y formato. Node `>=24` y pnpm `12.10.1` están en `package.json`.

Comandos: [SCRIPTS.md](SCRIPTS.md). App web: [apps/web/README.md](apps/web/README.md).
