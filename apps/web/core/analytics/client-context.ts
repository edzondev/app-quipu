/**
 * Contexto de cliente para propiedades de analytics (device, platform).
 *
 * Pensado para web hoy; en React Native / Expo sustituir la detección por
 * `Platform.OS` y dimensiones nativas, manteniendo estos helpers como API.
 */

import type { DeviceType, Platform } from "./events";

export function detectDeviceType(): DeviceType {
	if (typeof window === "undefined") return "desktop";
	const width = window.innerWidth;
	if (width < 768) return "mobile";
	if (width < 1024) return "tablet";
	return "desktop";
}

export function detectPlatform(): Platform {
	if (typeof navigator === "undefined") return "web";
	const ua = navigator.userAgent;
	if (/android/i.test(ua)) return "android";
	if (/iphone|ipad|ipod/i.test(ua)) return "ios";
	return "web";
}

export function getAuthSignupContext(): {
	device_type: DeviceType;
	platform: Platform;
} {
	return {
		device_type: detectDeviceType(),
		platform: detectPlatform(),
	};
}
