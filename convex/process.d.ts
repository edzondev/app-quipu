/**
 * Minimal process.env type declaration for Convex functions.
 * Convex supports process.env at runtime, but the Convex tsconfig doesn't
 * include @types/node (which would cause type pollution). This file provides
 * just the `process.env` global needed to typecheck env var access.
 */
declare const process: {
  env: Record<string, string | undefined>;
};
