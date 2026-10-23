import type { AddSourceResult, PlayStoreLinkResult } from "@/modules/quipu-notification-listener";
import {
	provisionalMark,
	readLink,
	savedBanks,
	sourceAccepted,
} from "@/shared/lib/settings/bank-link";

const catalog = [
	{ packageId: "pe.com.interbank.mobilebanking", name: "Interbank APP" },
	{ packageId: "com.bcp.bank.bcp", name: "Banca Móvil BCP" },
] as const;

const interbank = "https://play.google.com/store/apps/details?id=pe.com.interbank.mobilebanking";

describe("readLink", () => {
	it("stays empty until there is a link", () => {
		expect(readLink("", null, catalog)).toEqual({ kind: "empty" });
		expect(readLink("   ", null, catalog)).toEqual({ kind: "empty" });
	});

	it("rejects a link that is not a Play Store bank", () => {
		const parsed: PlayStoreLinkResult = { error: "invalid_link" };
		expect(readLink("https://wa.me/51999888777", parsed, catalog)).toEqual({ kind: "invalid" });
	});

	it("rejects a Play Store app that is not in the catalog", () => {
		const parsed: PlayStoreLinkResult = { packageId: "com.other.wallet" };
		expect(
			readLink("https://play.google.com/store/apps/details?id=com.other.wallet", parsed, catalog),
		).toEqual({ kind: "invalid" });
	});

	it("rejects a link when the parser is unavailable", () => {
		const parsed: PlayStoreLinkResult = { error: "unavailable" };
		expect(readLink(interbank, parsed, catalog)).toEqual({ kind: "invalid" });
	});

	it("names a catalog bank from the catalog, not from the link text", () => {
		const parsed: PlayStoreLinkResult = { packageId: "pe.com.interbank.mobilebanking" };
		expect(readLink(interbank, parsed, catalog)).toEqual({
			kind: "bank",
			bank: { packageId: "pe.com.interbank.mobilebanking", name: "Interbank APP" },
		});
	});
});

describe("savedBanks", () => {
	it("keeps catalog banks already registered and drops anything else", () => {
		expect(
			savedBanks(
				["com.bcp.bank.bcp", "com.other.wallet", "pe.com.interbank.mobilebanking"],
				catalog,
			),
		).toEqual([
			{ packageId: "com.bcp.bank.bcp", name: "Banca Móvil BCP" },
			{ packageId: "pe.com.interbank.mobilebanking", name: "Interbank APP" },
		]);
	});

	it("returns nothing when no source is a catalog bank", () => {
		expect(savedBanks(["com.other.wallet"], catalog)).toEqual([]);
	});
});

describe("sourceAccepted", () => {
	it("keeps a bank only when the listener saved it or already had it", () => {
		const accepted: AddSourceResult[] = ["added", "already_added"];
		const rejected: AddSourceResult[] = [
			"invalid_link",
			"not_installed",
			"added_unverified",
			"limit_reached",
		];
		for (const result of accepted) expect(sourceAccepted(result)).toBe(true);
		for (const result of rejected) expect(sourceAccepted(result)).toBe(false);
	});
});

describe("provisionalMark", () => {
	it("uses the first two letters of the catalog name", () => {
		expect(provisionalMark("Interbank APP")).toBe("IN");
		expect(provisionalMark("Yape")).toBe("YA");
		expect(provisionalMark("  bcp ")).toBe("BC");
	});
});
