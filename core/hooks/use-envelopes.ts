"use client";

import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";

/**
 * Returns the selectable expense envelopes for the current user.
 *
 * Each envelope includes:
 * - `key`       — "needs" | "wants" | "juntos"
 * - `label`     — display name in Spanish
 * - `emoji`     — icon for UI display
 * - `allocated` — monthly budget for this envelope
 * - `spent`     — amount spent so far this month
 * - `available` — remaining balance (can be negative if over budget)
 *
 * `null` while loading or when the user is unauthenticated/unprovisioned.
 */
export function useEnvelopes() {
  const envelopes = useQuery(api.envelopes.getEnvelopes);
  return { envelopes };
}
