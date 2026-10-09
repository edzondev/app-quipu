import { ConvexReactClient } from "convex/react";

const options = {
	unsavedChangesWarning: false,
	expectAuth: true,
} as const;

export function createConvexClient(): ConvexReactClient {
	return new ConvexReactClient(process.env.EXPO_PUBLIC_CONVEX_URL ?? "", options);
}

export function nextConvexClient<T extends { close: () => Promise<unknown> }>(
	current: T,
	create: () => T,
): T {
	const next = create();
	void current.close();
	return next;
}

type Reset = () => void;
let resetImpl: Reset = () => undefined;

export function registerConvexReset(reset: Reset): () => void {
	resetImpl = reset;
	return () => {
		if (resetImpl === reset) resetImpl = () => undefined;
	};
}

export function resetConvexClient(): void {
	resetImpl();
}
