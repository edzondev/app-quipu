import { formatLimaDate } from "@/shared/lib/date";

export function formatPasskeyUsageSummary(createdAt: Date): string {
	const now = Date.now();
	const created = createdAt.getTime();
	const dayMs = 86_400_000;
	const diffDays = Math.floor((now - created) / dayMs);

	if (diffDays <= 0) {
		return "Passkey · usada hoy";
	}
	if (diffDays === 1) {
		return "Passkey · usada ayer";
	}
	if (diffDays < 7) {
		return `Passkey · hace ${diffDays} días`;
	}

	return `Passkey · ${formatLimaDate(created, "es-PE")}`;
}

export function passkeyDeviceLabel(name: string | undefined, deviceType: string): string {
	if (name?.trim()) {
		return name.trim();
	}
	if (deviceType === "singleDevice") {
		return "Passkey en este dispositivo";
	}
	return "Passkey";
}
