import type { api } from "@quipu/convex-api";
import type { FunctionReturnType } from "convex/server";
import { marketFromCurrencyCode } from "@/shared/lib/onboarding/markets";

export type SettingsOverview = NonNullable<
	FunctionReturnType<typeof api.settings.getSettingsOverview>
>;

export type SettingsScreenModel = {
	initial: string;
	name: string;
	meta: string | null;
	passkeysLabel: string | null;
	planLabel: string;
	repartoLabel: string;
	scheduleCopy: string;
};

export function profileInitial(name: string): string {
	const first = name.trim()[0];
	return first ? first.toLocaleUpperCase("es-PE") : "";
}

export function repartoLabel(settings: SettingsOverview): string {
	const { needs, wants, savings } = settings.allocations;
	return `${needs} / ${wants} / ${savings}`;
}

export function presentSettings(settings: SettingsOverview): SettingsScreenModel {
	const country = marketFromCurrencyCode(settings.account.currencyCode)?.country ?? null;
	const email = settings.account.email;
	const passkeysLabel =
		settings.security.passkeysSource === "better_auth"
			? passkeyCopy(settings.security.passkeys.length)
			: null;
	return {
		initial: profileInitial(settings.account.name),
		name: settings.account.name,
		meta: email && country ? `${email} · ${country}` : (email ?? country),
		passkeysLabel,
		planLabel: settings.account.plan.tier === "free" ? "Gratis" : "Plus",
		repartoLabel: repartoLabel(settings),
		scheduleCopy: settings.cycle.scheduleCopy,
	};
}

function passkeyCopy(count: number): string {
	return count === 1 ? "1 llave" : `${count} llaves`;
}
