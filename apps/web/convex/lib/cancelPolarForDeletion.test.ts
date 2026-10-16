import { describe, expect, it, vi } from "vitest";
import {
	cancelPolarSubscriptionForDeletion,
	decidePolarDeletionCancel,
	isIgnorablePolarCancelError,
} from "./cancelPolarForDeletion";

describe("decidePolarDeletionCancel", () => {
	it("skips when there is no subscription", () => {
		expect(decidePolarDeletionCancel(null)).toBe("none");
	});

	it("skips when the subscription is already canceled", () => {
		expect(decidePolarDeletionCancel({ id: "sub_1", status: "canceled" })).toBe("already_canceled");
		expect(decidePolarDeletionCancel({ id: "sub_1", status: "revoked" })).toBe("already_canceled");
	});

	it("cancels active and trialing subscriptions", () => {
		expect(decidePolarDeletionCancel({ id: "sub_1", status: "active" })).toBe("cancel");
		expect(decidePolarDeletionCancel({ id: "sub_1", status: "trialing" })).toBe("cancel");
	});
});

describe("isIgnorablePolarCancelError", () => {
	it("treats missing or already-canceled Polar errors as done", () => {
		expect(isIgnorablePolarCancelError(new Error("Subscription not found"))).toBe(true);
		expect(isIgnorablePolarCancelError(new Error("Subscription is not active"))).toBe(true);
		expect(isIgnorablePolarCancelError({ name: "AlreadyCanceledSubscription" })).toBe(true);
		expect(isIgnorablePolarCancelError({ name: "ResourceNotFound" })).toBe(true);
	});

	it("does not ignore network failures", () => {
		expect(isIgnorablePolarCancelError(new Error("fetch failed"))).toBe(false);
		expect(isIgnorablePolarCancelError(new Error("ECONNRESET"))).toBe(false);
	});
});

describe("cancelPolarSubscriptionForDeletion", () => {
	it("does not call cancel when there is no subscription", async () => {
		const cancel = vi.fn();
		await expect(
			cancelPolarSubscriptionForDeletion({
				getCurrent: async () => null,
				cancel,
			}),
		).resolves.toBe("none");
		expect(cancel).not.toHaveBeenCalled();
	});

	it("does not call cancel when Polar already canceled the subscription", async () => {
		const cancel = vi.fn();
		await expect(
			cancelPolarSubscriptionForDeletion({
				getCurrent: async () => ({ id: "sub_1", status: "canceled" }),
				cancel,
			}),
		).resolves.toBe("already_canceled");
		expect(cancel).not.toHaveBeenCalled();
	});

	it("revokes an active subscription", async () => {
		const cancel = vi.fn().mockResolvedValue(undefined);
		await expect(
			cancelPolarSubscriptionForDeletion({
				getCurrent: async () => ({ id: "sub_1", status: "active" }),
				cancel,
			}),
		).resolves.toBe("canceled");
		expect(cancel).toHaveBeenCalledWith("sub_1");
	});

	it("treats a Polar already-canceled race as success", async () => {
		await expect(
			cancelPolarSubscriptionForDeletion({
				getCurrent: async () => ({ id: "sub_1", status: "trialing" }),
				cancel: async () => {
					throw new Error("Subscription is not active");
				},
			}),
		).resolves.toBe("already_canceled");
	});

	it("rethrows Polar network errors so deletion can abort", async () => {
		const networkError = new Error("fetch failed");
		await expect(
			cancelPolarSubscriptionForDeletion({
				getCurrent: async () => ({ id: "sub_1", status: "active" }),
				cancel: async () => {
					throw networkError;
				},
			}),
		).rejects.toBe(networkError);
	});
});
