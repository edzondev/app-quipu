import { vi } from "vitest";
import type { MutationCtx, QueryCtx } from "@/convex/_generated/server";

type PaginationResult<T> = {
  page: T[];
  continueCursor: string;
  isDone: boolean;
};

type DbQueryChain<T> = {
  withIndex: (
    indexName: string,
    fn: (q: unknown) => unknown,
  ) => DbQueryChain<T>;
  eq: (field: string, value: unknown) => DbQueryChain<T>;
  gte: (field: string, value: unknown) => DbQueryChain<T>;
  lt: (field: string, value: unknown) => DbQueryChain<T>;
  order: (direction: string) => DbQueryChain<T>;
  take: (n: number) => Promise<T[]>;
  first: () => Promise<T | null>;
  unique: () => Promise<T | null>;
  collect: () => Promise<T[]>;
  paginate: (opts: unknown) => Promise<PaginationResult<T>>;
};

export type OverrideValue<T = unknown> = T | ((callIndex: number) => T);

function resolveOverride<T>(
  override: OverrideValue<T> | undefined,
  callIndex: number,
): T | null {
  if (override === undefined) return null;
  if (typeof override === "function") {
    return (override as (callIndex: number) => T)(callIndex);
  }
  return override as T;
}

function createQueryBuilder<T>(
  result: T | T[] | null = [],
  paginationResult?: PaginationResult<T>,
): DbQueryChain<T> {
  const resolved = Array.isArray(result)
    ? result
    : result === null
      ? []
      : [result];
  const defaultPagination: PaginationResult<T> = {
    page: resolved,
    continueCursor: "",
    isDone: true,
  };
  return {
    withIndex: () => createQueryBuilder<T>(result, paginationResult),
    eq: () => createQueryBuilder<T>(result, paginationResult),
    gte: () => createQueryBuilder<T>(result, paginationResult),
    lt: () => createQueryBuilder<T>(result, paginationResult),
    order: () => createQueryBuilder<T>(result, paginationResult),
    take: async () => resolved,
    first: async () => (Array.isArray(result) ? (result[0] ?? null) : result),
    unique: async () => (Array.isArray(result) ? (result[0] ?? null) : result),
    collect: async () => resolved,
    paginate: async () => paginationResult ?? defaultPagination,
  };
}

function buildQueryMock(overrides: Record<string, OverrideValue<unknown>>) {
  const callCounts: Record<string, number> = {};

  return vi.fn().mockImplementation((table: string) => {
    const callIndex = callCounts[table] ?? 0;
    callCounts[table] = callIndex + 1;

    const override = overrides[table];
    const resolved = resolveOverride(override, callIndex);
    return createQueryBuilder(resolved);
  });
}

export function createMockMutationCtx(
  overrides: Record<string, OverrideValue<unknown>> = {},
): MutationCtx {
  const patchMock = vi.fn().mockResolvedValue(undefined);
  const insertMock = vi.fn().mockResolvedValue("mock-id" as never);
  const deleteMock = vi.fn().mockResolvedValue(undefined);
  const getMock = vi.fn().mockResolvedValue(null);
  const queryMock = buildQueryMock(overrides);

  return {
    db: {
      query: queryMock,
      patch: patchMock,
      insert: insertMock,
      delete: deleteMock,
      get: getMock,
    },
    auth: {
      getUserIdentity: vi.fn().mockResolvedValue(null),
    },
    scheduler: {
      runAfter: vi.fn().mockResolvedValue(undefined),
    },
    runMutation: vi.fn().mockResolvedValue(undefined),
    runAction: vi.fn().mockResolvedValue(undefined),
    runQuery: vi.fn().mockResolvedValue(undefined),
    storage: {} as MutationCtx["storage"],
  } as unknown as MutationCtx;
}

export function asMutationHandler<Args, Result = unknown>(
  mutation: unknown,
): (ctx: MutationCtx, args: Args) => Promise<Result> {
  return mutation as (ctx: MutationCtx, args: Args) => Promise<Result>;
}

export function createAuthenticatedMockMutationCtx(
  userId = "user_123",
  overrides: Record<string, OverrideValue<unknown>> = {},
): MutationCtx {
  const ctx = createMockMutationCtx(overrides);
  return {
    ...ctx,
    auth: {
      getUserIdentity: vi.fn().mockResolvedValue({ subject: userId }),
    },
  } as unknown as MutationCtx;
}

export function createMockQueryCtx(
  overrides: Record<string, OverrideValue<unknown>> = {},
): QueryCtx {
  const queryMock = buildQueryMock(overrides);

  return {
    db: {
      query: queryMock,
      get: vi.fn().mockResolvedValue(null),
    },
    auth: {
      getUserIdentity: vi.fn().mockResolvedValue({ subject: "user_123" }),
    },
    storage: {} as QueryCtx["storage"],
  } as unknown as QueryCtx;
}
