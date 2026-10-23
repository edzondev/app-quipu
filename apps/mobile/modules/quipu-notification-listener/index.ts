import { requireOptionalNativeModule } from "expo";

export type NotificationDiagnostics = {
	accessEnabled: boolean;
	loaded: boolean;
	sourceCount: number;
	recentIdCount: number;
	filteredOut: number;
	matched: number;
	deduped: number;
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

export type PlayStoreLinkResult = { packageId: string } | { error: "invalid_link" | "unavailable" };

type NativeNotificationListener = {
	isNotificationAccessEnabled(): boolean;
	openNotificationAccessSettings(): void;
	addSource(input: string): Promise<AddSourceResult>;
	removeSource(packageName: string): Promise<boolean>;
	getSources(): Promise<string[]>;
	getInstalledBanks(): Promise<InstalledBank[]>;
	parsePlayStoreLink(text: string): PlayStoreLinkResult;
	dismissNotice(id: string): void;
	getDiagnostics(): Promise<NotificationDiagnostics | null>;
};

const native = requireOptionalNativeModule<NativeNotificationListener>("QuipuNotificationListener");

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

export function dismissNotice(id: string): void {
	if (!native || id.length === 0) return;
	native.dismissNotice(id);
}

export async function getDiagnostics(): Promise<NotificationDiagnostics | null> {
	if (!native) return null;
	return native.getDiagnostics();
}
