import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Returns the current month as "YYYY-MM" string (UTC).
 *
 * **Client-only** (hooks, `"use client"` components). Do not call from async
 * Server Components when `cacheComponents` is enabled — use
 * `getServerCalendarStrings()` from `@/lib/server-calendar` instead.
 */
export function currentMonthString(): string {
  return new Date().toISOString().slice(0, 7);
}

/**
 * Returns today's date as "YYYY-MM-DD" string (UTC).
 *
 * **Client-only** — same rules as `currentMonthString`.
 */
export function todayString(): string {
  return new Date().toISOString().slice(0, 10);
}
