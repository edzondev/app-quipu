import type { api } from "@quipu/convex-api";
import type { FunctionReturnType } from "convex/server";
import { fixtureId } from "@/__fixtures__/convex-id";

type SettingsOverview = NonNullable<FunctionReturnType<typeof api.settings.getSettingsOverview>>;

type SettingsFixtureOptions = {
	email?: string | null;
	tier?: "free" | "premium";
	passkeysSource?: "better_auth" | "unavailable";
	passkeyCount?: number;
	currencyCode?: string;
};

export function settingsOverview(options: SettingsFixtureOptions = {}): SettingsOverview {
	const tier = options.tier ?? "free";
	const passkeyCount = options.passkeyCount ?? 2;
	const overview = {
		account: {
			name: "Edzon Perez",
			email: options.email === undefined ? "edzon@correo.com" : options.email,
			country: "PE",
			currencyCode: options.currencyCode ?? "PEN",
			currencySymbol: "S/",
			incomeModel: { value: "fixed", label: "Dependiente" },
			tags: [],
			plan: {
				tier,
				label: tier === "free" ? "Plan Quipu" : "Quipu Plus",
				priceCopy: null,
				statusCopy: tier === "free" ? "Plan gratuito" : "Activo",
			},
		},
		billing: {
			renewalSummary: null,
			subscriptionStatus: tier === "free" ? "free" : "active",
			cancelAtPeriodEnd: false,
			checkoutAvailable: false,
			premiumProductId: null,
			plusProductIds: { monthly: null, yearly: null },
			monthlyPriceLabel: "S/ 14.90",
		},
		allocations: { needs: 50, wants: 30, savings: 20 },
		cycle: {
			typeLabel: "Dependiente",
			scheduleCopy: "Mensual · día 1",
			cycleDays: 30,
			activeRangeCopy: null,
		},
		commitments: {
			items: [
				{
					id: fixtureId("fixedCommitments", "rent"),
					name: "Alquiler",
					amount: 110000,
					envelope: "needs",
					dueDay: 1,
				},
			],
			totalCents: 110000,
		},
		preferences: {
			dailySummaryEnabled: true,
			cycleAlertsEnabled: true,
			currencyReadOnly: "S/ · PEN",
			localeReadOnly: "Español",
		},
		security: {
			passkeys: Array.from({ length: passkeyCount }, (_, index) => ({
				id: `pk-${index + 1}`,
				name: null,
				label: null,
				deviceType: "unknown",
				backedUp: false,
				createdAt: null,
			})),
			passkeysSource: options.passkeysSource ?? "better_auth",
			sessions: { count: 0, apiReady: true },
			hasPassword: true,
			emailVerified: true,
		},
	} satisfies SettingsOverview;
	return overview;
}
