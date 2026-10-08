export type AccountStatus = "active" | "suspended" | "under_review";

export function isAccountAccessAllowed(accountStatus: AccountStatus | undefined): boolean {
	return !accountStatus || accountStatus === "active";
}
