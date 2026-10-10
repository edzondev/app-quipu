import { requireOptionalNativeModule } from "expo";

export type PendingNotification = {
	id: string;
	packageName: string;
	postedAt: number;
	title: string;
	text: string;
	subText?: string;
	bigText?: string;
};

export type NotificationSubscription = {
	remove: () => void;
};

export type NotificationDiagnostics = {
	accessEnabled: boolean;
	loaded: boolean;
	sourceCount: number;
	pendingCount: number;
	recentIdCount: number;
	filteredOut: number;
	matched: number;
	enqueued: number;
	deduped: number;
	consumed: number;
};

export type AddSourceResult =
	| "added"
	| "invalid_link"
	| "already_added"
	| "not_installed"
	| "added_unverified"
	| "limit_reached";

export type InstalledBank = {
	name: string;
	packageId: string;
	installed: boolean;
	label?: string;
	icon?: string;
};

export type PlayStoreLinkResult = { packageId: string } | { error: string };

type NativeNotificationListener = {
	isNotificationAccessEnabled(): boolean;
	openNotificationAccessSettings(): void;
	addSource(input: string): Promise<AddSourceResult>;
	removeSource(packageName: string): Promise<boolean>;
	getSources(): Promise<string[]>;
	getInstalledBanks(): Promise<InstalledBank[]>;
	parsePlayStoreLink(text: string): PlayStoreLinkResult;
	getPendingNotifications(): Promise<PendingNotification[]>;
	consumeNotification(id: string): Promise<boolean>;
	clearPendingNotifications(): Promise<void>;
	getDiagnostics(): Promise<NotificationDiagnostics | null>;
	addListener(
		eventName: "onNotification",
		listener: (event: PendingNotification) => void,
	): NotificationSubscription;
};

const native = requireOptionalNativeModule<NativeNotificationListener>("QuipuNotificationListener");

const noopSubscription: NotificationSubscription = {
	remove() {},
};

export function isNotificationAccessEnabled(): boolean {
	return native?.isNotificationAccessEnabled() ?? false;
}

export function openNotificationAccessSettings(): void {
	native?.openNotificationAccessSettings();
}

export async function addSource(input: string): Promise<AddSourceResult> {
	if (!native) return "invalid_link";
	return native.addSource(input);
}

export async function removeSource(packageName: string): Promise<boolean> {
	if (!native) return false;
	return native.removeSource(packageName);
}

export async function getSources(): Promise<string[]> {
	if (!native) return [];
	return native.getSources();
}

export async function getInstalledBanks(): Promise<InstalledBank[]> {
	if (!native) return [];
	return native.getInstalledBanks();
}

export function parsePlayStoreLink(text: string): PlayStoreLinkResult {
	if (!native) return { error: "unavailable" };
	return native.parsePlayStoreLink(text);
}

export async function getPendingNotifications(): Promise<PendingNotification[]> {
	if (!native) return [];
	return native.getPendingNotifications();
}

export async function consumeNotification(id: string): Promise<boolean> {
	if (!native) return false;
	return native.consumeNotification(id);
}

export async function clearPendingNotifications(): Promise<void> {
	if (!native) return;
	await native.clearPendingNotifications();
}

export function addNotificationListener(
	listener: (event: PendingNotification) => void,
): NotificationSubscription {
	if (!native) return noopSubscription;
	return native.addListener("onNotification", listener);
}

export async function getDiagnostics(): Promise<NotificationDiagnostics | null> {
	if (!native) return null;
	return native.getDiagnostics();
}
