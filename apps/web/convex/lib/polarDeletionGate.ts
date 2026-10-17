/**
 * Polar blocks account deletion only while billing can still charge.
 *
 * Blocks: status in {active, trialing, past_due, unpaid} AND
 * cancelAtPeriodEnd === false.
 *
 * Allows: no subscription; canceled/revoked; or cancelAtPeriodEnd === true
 * (already canceled, access until period end). The Polar webhook keeps
 * updating the local plan; deletion does not call Polar cancel/revoke.
 */
const BILLABLE_POLAR_STATUSES = new Set(["active", "trialing", "past_due", "unpaid"]);

export type PolarDeletionSubscription = {
	status: string;
	cancelAtPeriodEnd: boolean;
} | null;

export function polarSubscriptionBlocksDeletion(subscription: PolarDeletionSubscription): boolean {
	if (subscription === null) return false;
	if (subscription.cancelAtPeriodEnd) return false;
	return BILLABLE_POLAR_STATUSES.has(subscription.status);
}
