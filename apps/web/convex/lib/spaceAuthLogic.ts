import type { Doc } from "../_generated/dataModel";

export function assertCurrencyCompatible(
	inviteeProfile: Pick<Doc<"profiles">, "onboardingComplete" | "currencyCode">,
	space: Pick<Doc<"financialSpaces">, "currencyCode">,
): { ok: true } | { ok: false; reason: "CURRENCY_MISMATCH" } {
	if (inviteeProfile.onboardingComplete && inviteeProfile.currencyCode !== space.currencyCode) {
		return { ok: false, reason: "CURRENCY_MISMATCH" };
	}
	return { ok: true };
}

export function isSpaceWritable(
	space: Pick<Doc<"financialSpaces">, "status">,
	creatorProfile: Pick<Doc<"profiles">, "plan">,
): boolean {
	return space.status === "active" && creatorProfile.plan === "premium";
}

export function shouldTransitionSpaceToReadonly(
	space: Pick<Doc<"financialSpaces">, "status">,
	creatorProfile: Pick<Doc<"profiles">, "plan">,
): boolean {
	return space.status === "active" && creatorProfile.plan !== "premium";
}

export function canReactivateSpace(
	space: Pick<Doc<"financialSpaces">, "status">,
	creatorProfile: Pick<Doc<"profiles">, "plan">,
): boolean {
	return space.status === "readonly" && creatorProfile.plan === "premium";
}

export const MAX_SPACE_MEMBERS = 2;

export function hasMemberCapacity(activeMemberCount: number): boolean {
	return activeMemberCount < MAX_SPACE_MEMBERS;
}
