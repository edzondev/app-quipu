import { isDeviceOnline } from "@/shared/lib/network/device-online";

describe("isDeviceOnline", () => {
	it("trata estado desconocido como online", () => {
		expect(isDeviceOnline({})).toBe(true);
		expect(isDeviceOnline({ isConnected: null })).toBe(true);
	});

	it("está offline si no hay conexión", () => {
		expect(isDeviceOnline({ isConnected: false })).toBe(false);
	});

	it("está online si hay conexión y reachable no es false", () => {
		expect(isDeviceOnline({ isConnected: true })).toBe(true);
		expect(isDeviceOnline({ isConnected: true, isInternetReachable: null })).toBe(true);
		expect(isDeviceOnline({ isConnected: true, isInternetReachable: true })).toBe(true);
	});

	it("está offline si reachable es false", () => {
		expect(isDeviceOnline({ isConnected: true, isInternetReachable: false })).toBe(false);
	});
});
