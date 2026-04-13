import { connection } from "next/server";

/**
 * YYYY-MM and YYYY-MM-DD derived from request time for Convex preloads from
 * Server Components.
 *
 * With `cacheComponents`, `new Date()` is not allowed in RSC until request-time
 * context is read — `connection()` satisfies that (see next-prerender-current-time).
 *
 * Do not use from Client Components; use `currentMonthString` / `todayString` from
 * `@/lib/utils` there instead.
 */
export async function getServerCalendarStrings(): Promise<{
  month: string;
  today: string;
}> {
  await connection();
  const now = new Date();
  return {
    month: now.toISOString().slice(0, 7),
    today: now.toISOString().slice(0, 10),
  };
}
