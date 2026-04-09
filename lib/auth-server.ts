import { convexBetterAuthNextJs } from "@convex-dev/better-auth/nextjs";
import { getConvexSiteUrl, getConvexUrl } from "@/lib/env";

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
