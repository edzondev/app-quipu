import { ACTION_TIMEOUT_MS, assertOnline, withTimeout } from "@/shared/lib/network/await-online";

/** Offline check + timeout around a network mutation. Same message for both failures. */
export async function runAction<T>(work: () => Promise<T>, fallback: string): Promise<T> {
	await assertOnline(fallback);
	return withTimeout(work(), ACTION_TIMEOUT_MS, fallback);
}
