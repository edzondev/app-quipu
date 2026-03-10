"use client";

import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";

/**
 * Returns the current user's profile plus derived boolean flags for
 * conditional UI logic (styles, feature gates, validations).
 *
 * Use this instead of calling getMyProfile directly when you only need
 * flags — avoids prop drilling and keeps components decoupled from
 * the full profile shape.
 *
 * `profile` is `undefined` while loading, `null` when unauthenticated
 * or before onboarding. Flags default to `false` in both cases.
 *
 * Note: for plan/premium checks use `usePlan()` from `@/hooks/use-plan`
 * instead — it is the single source of truth for subscription state.
 */
export function useProfile() {
  const profile = useQuery(api.profiles.getMyProfile);

  const hasJuntos = profile?.coupleModeEnabled ?? false;

  return { profile, hasJuntos };
}
