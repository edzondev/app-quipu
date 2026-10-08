import { type Infer, v } from "convex/values";

/** Origen de sobrante que ya persiste `surplusContributions.fromEnvelope`. */
export const surplusFromEnvelopeValidator = v.union(
	v.literal("needs"),
	v.literal("wants"),
	v.literal("extraordinary"),
);

export type SurplusFromEnvelope = Infer<typeof surplusFromEnvelopeValidator>;

const closedCycleSurplusSubEnvelopeFields = {
	kind: v.literal("subEnvelope"),
	subEnvelopeId: v.id("subEnvelopes"),
};

const closedCycleSurplusLeaveFields = {
	kind: v.literal("leave"),
};

export const closedCycleSurplusDestinationValidator = v.union(
	v.object(closedCycleSurplusSubEnvelopeFields),
	v.object(closedCycleSurplusLeaveFields),
);

export type ClosedCycleSurplusDestination = Infer<typeof closedCycleSurplusDestinationValidator>;

export const surplusAssignmentDestinationValidator = v.union(
	v.object({
		...closedCycleSurplusSubEnvelopeFields,
		name: v.union(v.string(), v.null()),
		isSystemDefault: v.boolean(),
	}),
	v.object(closedCycleSurplusLeaveFields),
);

export const closedCycleSurplusEnvelopeValidator = v.object({
	fromEnvelope: surplusFromEnvelopeValidator,
	label: v.string(),
	total: v.number(),
	available: v.number(),
});
