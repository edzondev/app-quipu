import { convexBetterAuthNextJs } from "@convex-dev/better-auth/nextjs";
import { getConvexSiteUrl, getConvexUrl } from "@/lib/env";
import { api } from "@/convex/_generated/api";
import { redirect } from "next/navigation";

export const {
  handler,
  preloadAuthQuery,
  isAuthenticated,
  getToken,
  fetchAuthQuery,
} = convexBetterAuthNextJs({
  convexUrl: getConvexUrl(),
  convexSiteUrl: getConvexSiteUrl(),
});

/**
 * Shared guard for authenticated routes that require a completed profile.
 * Redirects to /login if not authenticated, or /onboarding if profile is incomplete.
 * Returns the full profile on success.
 */
export async function requireAuthWithProfile() {
  const authed = await isAuthenticated();
  if (!authed) redirect("/login");

  const profile = await fetchAuthQuery(api.profiles.getMyProfile, {});
  if (!profile || !profile.onboardingComplete) redirect("/onboarding");

  return profile;
}
