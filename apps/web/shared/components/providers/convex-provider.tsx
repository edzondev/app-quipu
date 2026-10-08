"use client";

import { type AuthClient, ConvexBetterAuthProvider } from "@convex-dev/better-auth/react";
import { ConvexReactClient } from "convex/react";
import { type ReactNode, useEffect, useRef } from "react";
import { authClient } from "@/auth/auth-client";
import { identify, reset } from "@/core/analytics";
import { PostHogPageviewTracker } from "@/shared/components/analytics/posthog-pageview-tracker";

const convex = new ConvexReactClient(process.env.NEXT_PUBLIC_CONVEX_URL ?? "", {
	unsavedChangesWarning: false,
});

function PostHogIdentity() {
	const { data } = authClient.useSession();
	const identifiedUserId = useRef<string | null>(null);
	const user = data?.user;

	useEffect(() => {
		if (!user) {
			if (identifiedUserId.current) {
				reset();
				identifiedUserId.current = null;
			}
			return;
		}

		if (identifiedUserId.current === user.id) return;

		if (identifiedUserId.current) reset();

		identify(user.id, {
			email: user.email,
			name: user.name,
		});
		identifiedUserId.current = user.id;
	}, [user]);

	return null;
}

export function ConvexClientProvider({
	children,
	initialToken,
}: {
	children: ReactNode;
	initialToken?: string | null;
}) {
	return (
		<ConvexBetterAuthProvider
			client={convex}
			authClient={authClient as unknown as AuthClient}
			initialToken={initialToken}
		>
			<PostHogIdentity />
			<PostHogPageviewTracker />
			{children}
		</ConvexBetterAuthProvider>
	);
}
