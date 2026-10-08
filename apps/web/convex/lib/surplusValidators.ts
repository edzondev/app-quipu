import { type Infer, v } from "convex/values";

/** Origen de sobrante que ya persiste `surplusContributions.fromEnvelope`. */
export const surplusFromEnvelopeValidator = v.union(
	v.literal("needs"),
	v.literal("wants"),
	v.literal("extraordinary"),
);

export type SurplusFromEnvelope = Infer<typeof surplusFromEnvelopeValidator>;

export const closedCycleSurplusDestinationValidator = v.union(
	v.object({
		kind: v.literal("subEnvelope"),
		subEnvelopeId: v.id("subEnvelopes"),
	}),
	v.object({
		kind: v.literal("leave"),
	}),
);

export type ClosedCycleSurplusDestination = Infer<typeof closedCycleSurplusDestinationValidator>;
