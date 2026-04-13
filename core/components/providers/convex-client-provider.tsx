"use client";

import { ConvexBetterAuthProvider } from "@convex-dev/better-auth/react";
import { ConvexReactClient, useQuery } from "convex/react";
import posthog from "posthog-js";
import { useEffect } from "react";
import { api } from "@/convex/_generated/api";
import { authClient } from "@/lib/auth-client";
import { getConvexUrl, getPosthogKey } from "@/lib/env";

const convex = new ConvexReactClient(getConvexUrl());

function PostHogIdentify() {
  const { data: session } = authClient.useSession();
  const profile = useQuery(api.profiles.getMyProfile);

  useEffect(() => {
    if (!session?.user?.id || !getPosthogKey()) return;

    const props: Record<string, unknown> = {};

    if (profile?.workerType) {
      props.mode =
        profile.workerType === "independent" ? "independiente" : "dependiente";
    }

    if (typeof profile?.distributionsCompleted === "number") {
      props.distributions_completed = profile.distributionsCompleted;
    }

    if (profile?._creationTime) {
      const created = new Date(profile._creationTime);
      const now = new Date();
      const months =
        (now.getFullYear() - created.getFullYear()) * 12 +
        (now.getMonth() - created.getMonth());
      if (months >= 0) props.months_active = months;
    }

    posthog.identify(
      session.user.id,
      Object.keys(props).length > 0 ? props : undefined,
    );
  }, [
    session?.user?.id,
    profile?.workerType,
    profile?.distributionsCompleted,
    profile?._creationTime,
  ]);

  return null;
}

export function ConvexClientProvider({
  children,
  initialToken,
}: {
  children: React.ReactNode;
  initialToken?: string | null;
}) {
  return (
    <ConvexBetterAuthProvider
      client={convex}
      authClient={authClient}
      initialToken={initialToken}
    >
      <PostHogIdentify />
      {children}
    </ConvexBetterAuthProvider>
  );
}
