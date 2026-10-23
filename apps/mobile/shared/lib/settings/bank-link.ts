import type {
	AddSourceResult,
	InstalledBank,
	PlayStoreLinkResult,
} from "@/modules/quipu-notification-listener";

export type CatalogBank = Pick<InstalledBank, "packageId" | "name">;

export type DetectedBank = {
	packageId: string;
	name: string;
};

export type LinkRead =
	| { kind: "empty" }
	| { kind: "invalid" }
	| { kind: "bank"; bank: DetectedBank };

export function readLink(
	text: string,
	parsed: PlayStoreLinkResult | null,
	catalog: readonly CatalogBank[],
): LinkRead {
	if (text.trim() === "") return { kind: "empty" };
	if (parsed === null || !("packageId" in parsed)) return { kind: "invalid" };
	const bank = catalog.find((item) => item.packageId === parsed.packageId);
	if (!bank) return { kind: "invalid" };
	return { kind: "bank", bank: { packageId: bank.packageId, name: bank.name } };
}

export function savedBanks(
	sourceIds: readonly string[],
	catalog: readonly CatalogBank[],
): DetectedBank[] {
	return sourceIds.flatMap((packageId) => {
		const bank = catalog.find((item) => item.packageId === packageId);
		return bank ? [{ packageId: bank.packageId, name: bank.name }] : [];
	});
}

export function sourceAccepted(result: AddSourceResult): boolean {
	return result === "added" || result === "already_added";
}

export function provisionalMark(name: string): string {
	const word = name.trim().split(/\s+/)[0] ?? "";
	return word.slice(0, 2).toLocaleUpperCase("es-PE");
}
