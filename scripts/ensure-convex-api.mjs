import { existsSync, mkdirSync, writeFileSync } from "node:fs";
import { dirname } from "node:path";

// `@quipu/convex-api` is produced by `pnpm --filter @quipu/web convex:export-api`
// and gitignored. A fresh checkout has no `src/api.ts`, so mobile `tsc` and Jest
// cannot resolve the import. When the file is missing, write the same runtime
// the generator emits (`anyApi`) without contacting a Convex deployment.
// A locally generated spec is left as-is.
const apiPath = "packages/convex-api/src/api.ts";

if (!existsSync(apiPath)) {
	mkdirSync(dirname(apiPath), { recursive: true });
	writeFileSync(apiPath, 'import { anyApi } from "convex/server";\n\nexport const api = anyApi;\n');
}
