export type DeviceNetworkSnapshot = {
	isConnected?: boolean | null;
	isInternetReachable?: boolean | null;
};

/** Desconocido cuenta como online para no flashar la franja al montar. */
export function isDeviceOnline(state: DeviceNetworkSnapshot): boolean {
	if (state.isConnected == null) return true;
	if (state.isConnected === false) return false;
	if (state.isInternetReachable === false) return false;
	return true;
}
