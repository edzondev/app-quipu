import { getNetworkStateAsync } from "expo-network";
import { isDeviceOnline } from "@/shared/lib/network/device-online";

export class OfflineError extends Error {
	constructor(message: string) {
		super(message);
		this.name = "OfflineError";
	}
}

export class TimeoutError extends Error {
	constructor(message: string) {
		super(message);
		this.name = "TimeoutError";
	}
}

export async function assertOnline(message: string): Promise<void> {
	const state = await getNetworkStateAsync();
	if (!isDeviceOnline(state)) throw new OfflineError(message);
}

export function withTimeout<T>(promise: Promise<T>, ms: number, message: string): Promise<T> {
	return new Promise((resolve, reject) => {
		const timer = setTimeout(() => {
			reject(new TimeoutError(message));
		}, ms);
		promise.then(
			(value) => {
				clearTimeout(timer);
				resolve(value);
			},
			(error) => {
				clearTimeout(timer);
				reject(error);
			},
		);
	});
}

export const ACTION_TIMEOUT_MS = 10_000;
