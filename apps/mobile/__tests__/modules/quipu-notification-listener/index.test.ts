type PendingNotification = {
	id: string;
	packageName: string;
	postedAt: number;
	title: string;
	text: string;
};

type NativeModule = {
	isNotificationAccessEnabled: jest.Mock;
	openNotificationAccessSettings: jest.Mock;
	addSource: jest.Mock;
	removeSource: jest.Mock;
	getSources: jest.Mock;
	getInstalledBanks: jest.Mock;
	parsePlayStoreLink: jest.Mock;
	getPendingNotifications: jest.Mock;
	consumeNotification: jest.Mock;
	clearPendingNotifications: jest.Mock;
	getDiagnostics: jest.Mock;
	addListener: jest.Mock;
};

const mockHolder: { native: NativeModule | null } = { native: null };

jest.mock("expo", () => ({
	requireOptionalNativeModule: () => mockHolder.native,
}));

function nativeDouble() {
	const subscription = { remove: jest.fn() };
	const native: NativeModule = {
		isNotificationAccessEnabled: jest.fn(() => true),
		openNotificationAccessSettings: jest.fn(),
		addSource: jest.fn(async () => "added"),
		removeSource: jest.fn(async () => true),
		getSources: jest.fn(async () => ["com.bank.one"]),
		getInstalledBanks: jest.fn(async () => [
			{ name: "Banca Móvil BCP", packageId: "com.bcp.bank.bcp", installed: true },
		]),
		parsePlayStoreLink: jest.fn(() => ({ packageId: "com.bcp.bank.bcp" })),
		getPendingNotifications: jest.fn(
			async (): Promise<PendingNotification[]> => [
				{
					id: "k|1",
					packageName: "com.bank.one",
					postedAt: 1,
					title: "Pago",
					text: "S/ 10",
				},
			],
		),
		consumeNotification: jest.fn(async () => true),
		clearPendingNotifications: jest.fn(async () => undefined),
		getDiagnostics: jest.fn(async () => ({
			accessEnabled: true,
			loaded: true,
			sourceCount: 1,
			pendingCount: 1,
			recentIdCount: 1,
			filteredOut: 0,
			matched: 1,
			enqueued: 1,
			deduped: 0,
			consumed: 0,
		})),
		addListener: jest.fn(() => subscription),
	};
	return { subscription, native };
}

function load() {
	let loaded: typeof import("@/modules/quipu-notification-listener") | undefined;
	jest.isolateModules(() => {
		loaded = require("@/modules/quipu-notification-listener");
	});
	if (!loaded) {
		throw new Error("module did not load");
	}
	return loaded;
}

describe("quipu notification listener wrapper", () => {
	afterEach(() => {
		mockHolder.native = null;
	});

	it("delega al módulo nativo cuando está presente", async () => {
		const native = nativeDouble();
		mockHolder.native = native.native;
		const api = load();
		const listener = jest.fn();

		expect(api.isNotificationAccessEnabled()).toBe(true);
		api.openNotificationAccessSettings();
		await expect(api.addSource("com.bank.one")).resolves.toBe("added");
		await expect(api.getInstalledBanks()).resolves.toEqual([
			{ name: "Banca Móvil BCP", packageId: "com.bcp.bank.bcp", installed: true },
		]);
		expect(api.parsePlayStoreLink("com.bcp.bank.bcp")).toEqual({
			packageId: "com.bcp.bank.bcp",
		});
		await expect(api.removeSource("com.bank.one")).resolves.toBe(true);
		await expect(api.getSources()).resolves.toEqual(["com.bank.one"]);
		await expect(api.getPendingNotifications()).resolves.toEqual([
			{
				id: "k|1",
				packageName: "com.bank.one",
				postedAt: 1,
				title: "Pago",
				text: "S/ 10",
			},
		]);
		await expect(api.consumeNotification("k|1")).resolves.toBe(true);
		await expect(api.clearPendingNotifications()).resolves.toBeUndefined();
		await expect(api.getDiagnostics()).resolves.toMatchObject({ sourceCount: 1 });

		const subscription = api.addNotificationListener(listener);
		expect(native.native.addListener).toHaveBeenCalledWith("onNotification", listener);
		subscription.remove();
		expect(native.subscription.remove).toHaveBeenCalledTimes(1);

		expect(native.native.openNotificationAccessSettings).toHaveBeenCalledTimes(1);
		expect(native.native.addSource).toHaveBeenCalledWith("com.bank.one");
		expect(native.native.consumeNotification).toHaveBeenCalledWith("k|1");
	});

	it("devuelve valores seguros cuando el módulo nativo no está", async () => {
		mockHolder.native = null;
		const api = load();
		const listener = jest.fn();

		expect(api.isNotificationAccessEnabled()).toBe(false);
		expect(() => api.openNotificationAccessSettings()).not.toThrow();
		await expect(api.addSource("com.bank.one")).resolves.toBe("invalid_link");
		await expect(api.getInstalledBanks()).resolves.toEqual([]);
		expect(api.parsePlayStoreLink("com.bcp.bank.bcp")).toEqual({ error: "unavailable" });
		await expect(api.removeSource("com.bank.one")).resolves.toBe(false);
		await expect(api.getSources()).resolves.toEqual([]);
		await expect(api.getPendingNotifications()).resolves.toEqual([]);
		await expect(api.consumeNotification("k|1")).resolves.toBe(false);
		await expect(api.clearPendingNotifications()).resolves.toBeUndefined();
		await expect(api.getDiagnostics()).resolves.toBeNull();

		const subscription = api.addNotificationListener(listener);
		expect(() => subscription.remove()).not.toThrow();
		expect(listener).not.toHaveBeenCalled();
	});
});
