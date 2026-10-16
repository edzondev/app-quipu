const BILLABLE_POLAR_STATUSES = new Set(["active", "trialing"]);

const IGNORABLE_POLAR_ERROR_NAMES = new Set(["AlreadyCanceledSubscription", "ResourceNotFound"]);

export type PolarDeletionLookup = {
	id: string;
	status: string;
} | null;

export type PolarDeletionDecision = "none" | "already_canceled" | "cancel";

export type PolarDeletionOutcome = "none" | "already_canceled" | "canceled";

export function decidePolarDeletionCancel(
	subscription: PolarDeletionLookup,
): PolarDeletionDecision {
	if (subscription === null) return "none";
	if (!BILLABLE_POLAR_STATUSES.has(subscription.status)) return "already_canceled";
	return "cancel";
}

function errorName(error: unknown): string | null {
	if (typeof error !== "object" || error === null) return null;
	if (!("name" in error)) return null;
	return typeof error.name === "string" ? error.name : null;
}

function errorMessage(error: unknown): string {
	if (error instanceof Error) return error.message;
	if (typeof error === "string") return error;
	return "";
}

export function isIgnorablePolarCancelError(error: unknown): boolean {
	const name = errorName(error);
	if (name !== null && IGNORABLE_POLAR_ERROR_NAMES.has(name)) return true;
	const message = errorMessage(error).toLowerCase();
	return (
		message.includes("subscription not found") ||
		message.includes("subscription is not active") ||
		message.includes("already canceled")
	);
}

export async function cancelPolarSubscriptionForDeletion(input: {
	getCurrent: () => Promise<PolarDeletionLookup>;
	cancel: (subscriptionId: string) => Promise<void>;
}): Promise<PolarDeletionOutcome> {
	const current = await input.getCurrent();
	const decision = decidePolarDeletionCancel(current);
	if (decision !== "cancel") return decision;
	if (current === null) return "none";
	try {
		await input.cancel(current.id);
		return "canceled";
	} catch (error) {
		if (isIgnorablePolarCancelError(error)) return "already_canceled";
		throw error;
	}
}
