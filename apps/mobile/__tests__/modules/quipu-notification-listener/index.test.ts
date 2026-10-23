type NativeModule = {
	isNotificationAccessEnabled: jest.Mock;
	openNotificationAccessSettings: jest.Mock;
	addSource: jest.Mock;
	removeSource: jest.Mock;
	getSources: jest.Mock;
	clear: jest.Mock;
	getInstalledBanks: jest.Mock;
	parsePlayStoreLink: jest.Mock;
	getDiagnostics: jest.Mock;
};

const mockHolder: { native: NativeModule | null } = { native: null };

jest.mock("expo", () => ({
	requireOptionalNativeModule: () => mockHolder.native,
}));

function nativeDouble() {
	const native: NativeModule = {
		isNotificationAccessEnabled: jest.fn(() => true),
		openNotificationAccessSettings: jest.fn(),
		addSource: jest.fn(async () => "added"),
		removeSource: jest.fn(async () => true),
		getSources: jest.fn(async () => ["com.bank.one"]),
		clear: jest.fn(async () => undefined),
		getInstalledBanks: jest.fn(async () => [
			{ name: "Banca Móvil BCP", packageId: "com.bcp.bank.bcp", installed: true },
		]),
		parsePlayStoreLink: jest.fn(() => ({ packageId: "com.bcp.bank.bcp" })),
		getDiagnostics: jest.fn(async () => ({
			accessEnabled: true,
			loaded: true,
			sourceCount: 1,
			recentIdCount: 1,
			filteredOut: 0,
			matched: 1,
			deduped: 0,
		})),
	};
	return { native };
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
		await expect(api.clear()).resolves.toBeUndefined();
		await expect(api.getDiagnostics()).resolves.toMatchObject({ sourceCount: 1 });

		expect(native.native.openNotificationAccessSettings).toHaveBeenCalledTimes(1);
		expect(native.native.addSource).toHaveBeenCalledWith("com.bank.one");
		expect(native.native.clear).toHaveBeenCalledTimes(1);
	});

	it("devuelve valores seguros cuando el módulo nativo no está", async () => {
		mockHolder.native = null;
		const api = load();

		expect(api.isNotificationAccessEnabled()).toBe(false);
		expect(() => api.openNotificationAccessSettings()).not.toThrow();
		await expect(api.addSource("com.bank.one")).resolves.toBe("invalid_link");
		await expect(api.getInstalledBanks()).resolves.toEqual([]);
		expect(api.parsePlayStoreLink("com.bcp.bank.bcp")).toEqual({ error: "unavailable" });
		await expect(api.removeSource("com.bank.one")).resolves.toBe(false);
		await expect(api.getSources()).resolves.toEqual([]);
		await expect(api.clear()).resolves.toBeUndefined();
		await expect(api.getDiagnostics()).resolves.toBeNull();
	});
});
