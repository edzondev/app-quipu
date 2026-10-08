import { httpRouter } from "convex/server";
import { internal } from "./_generated/api";
import type { ActionCtx } from "./_generated/server";
import { authComponent, createAuth } from "./auth";
import { extractUserIdFromPolarCustomerMetadata } from "./lib/billingSync";
import { polar } from "./polar";

const http = httpRouter();

authComponent.registerRoutes(http, createAuth);

type PolarSubscriptionWebhookEvent = {
	data: {
		id: string;
		customerId: string;
		productId: string;
		status: string;
		currentPeriodEnd: Date | string | null;
		cancelAtPeriodEnd: boolean;
		customer: {
			metadata?: Record<string, unknown>;
			externalId?: string | null;
		};
	};
};

async function syncProfileFromPolarEvent(ctx: ActionCtx, event: PolarSubscriptionWebhookEvent) {
	const userId = extractUserIdFromPolarCustomerMetadata(
		event.data.customer.metadata,
		event.data.customer.externalId,
	);
	if (!userId) {
		console.warn("Polar webhook: missing userId on customer metadata");
		return;
	}

	const currentPeriodEnd =
		event.data.currentPeriodEnd instanceof Date
			? event.data.currentPeriodEnd.toISOString()
			: event.data.currentPeriodEnd;

	await ctx.runMutation(internal.billing.applyProfilePlanFromPolar, {
		userId,
		polarCustomerId: event.data.customerId,
		polarSubscriptionId: event.data.id,
		productId: event.data.productId,
		status: event.data.status,
		currentPeriodEnd,
		cancelAtPeriodEnd: event.data.cancelAtPeriodEnd,
	});
}

polar.registerRoutes(http, {
	path: "/webhook/polar",
	events: {
		"subscription.created": async (ctx, event) => {
			await syncProfileFromPolarEvent(ctx as ActionCtx, event);
		},
		"subscription.updated": async (ctx, event) => {
			await syncProfileFromPolarEvent(ctx as ActionCtx, event);
		},
	},
});

export default http;
