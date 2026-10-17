import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const deleteAccount = vi.fn();

vi.mock("next/navigation", () => ({
	useRouter: () => ({ push: vi.fn(), refresh: vi.fn() }),
}));

vi.mock("convex/react", () => ({
	useAction: () => vi.fn(),
}));

vi.mock("@/modules/auth/hooks/use-passkey-support", () => ({
	usePasskeySupport: () => ({ webauthn: false, conditionalUI: false }),
}));

vi.mock("../lib/delete-account", () => ({
	deleteAccount: (...args: unknown[]) => deleteAccount(...args),
}));

import {
	SETTINGS_DELETE_ACCOUNT,
	SETTINGS_DELETE_ACCOUNT_CONFIRM,
	SETTINGS_DELETE_ACCOUNT_ERROR_POLAR_ACTIVE,
	SETTINGS_DELETE_ACCOUNT_POLAR_PORTAL,
	SETTINGS_DELETE_ACCOUNT_TITLE,
} from "../constants";
import { SettingsDeleteAccountItem } from "./settings-delete-account-item";

afterEach(() => {
	cleanup();
});

describe("SettingsDeleteAccountItem", () => {
	beforeEach(() => {
		deleteAccount.mockReset();
	});

	it("lets a premium-looking account try to delete instead of opening Polar first", () => {
		render(<SettingsDeleteAccountItem hasPassword={false} />);
		fireEvent.click(screen.getByRole("button", { name: SETTINGS_DELETE_ACCOUNT }));
		expect(screen.getByRole("button", { name: SETTINGS_DELETE_ACCOUNT_CONFIRM })).toBeTruthy();
		expect(screen.queryByRole("button", { name: SETTINGS_DELETE_ACCOUNT_POLAR_PORTAL })).toBeNull();
		expect(screen.getByText(SETTINGS_DELETE_ACCOUNT_TITLE)).toBeTruthy();
	});

	it("shows the Polar portal only after the server reports an active subscription", async () => {
		deleteAccount.mockResolvedValue({
			ok: false,
			code: "POLAR_SUBSCRIPTION_ACTIVE",
			message: SETTINGS_DELETE_ACCOUNT_ERROR_POLAR_ACTIVE,
		});
		render(<SettingsDeleteAccountItem hasPassword={false} />);
		fireEvent.click(screen.getByRole("button", { name: SETTINGS_DELETE_ACCOUNT }));
		fireEvent.click(screen.getByRole("button", { name: SETTINGS_DELETE_ACCOUNT_CONFIRM }));
		await waitFor(() => {
			expect(
				screen.getByRole("button", { name: SETTINGS_DELETE_ACCOUNT_POLAR_PORTAL }),
			).toBeTruthy();
		});
		expect(screen.getByRole("button", { name: SETTINGS_DELETE_ACCOUNT_CONFIRM })).toBeTruthy();
		expect(deleteAccount).toHaveBeenCalledTimes(1);
	});
});
