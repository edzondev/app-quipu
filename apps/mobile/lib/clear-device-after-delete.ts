import { signOutAndClearLocalData } from "@/lib/device-sign-out";

/**
 * After Better Auth deleteUser the server already dropped sessions, so
 * signOut fails. Clear the phone anyway and ignore serverNotified.
 */
export async function clearDeviceAfterAccountDeleted(): Promise<void> {
	await signOutAndClearLocalData();
}
