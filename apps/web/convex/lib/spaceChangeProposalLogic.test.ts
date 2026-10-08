import { describe, expect, it } from "vitest";
import {
	canProposeChange,
	canRespondToProposal,
	shouldRequireDualConfirmation,
} from "./spaceChangeProposalLogic";

const ownerId = "owner" as never;
const memberId = "member" as never;

describe("spaceChangeProposalLogic", () => {
	it("owner can propose allocation, cycle duration, and both contributions", () => {
		expect(
			canProposeChange({
				role: "owner",
				kind: "allocation",
				callerProfileId: ownerId,
			}),
		).toBe(true);
		expect(
			canProposeChange({
				role: "owner",
				kind: "expected_contribution",
				callerProfileId: ownerId,
			}),
		).toBe(true);
	});

	it("member can only propose own expected contribution", () => {
		expect(
			canProposeChange({
				role: "member",
				kind: "allocation",
				callerProfileId: memberId,
			}),
		).toBe(false);
		expect(
			canProposeChange({
				role: "member",
				kind: "expected_contribution",
				targetProfileId: memberId,
				callerProfileId: memberId,
			}),
		).toBe(true);
		expect(
			canProposeChange({
				role: "member",
				kind: "expected_contribution",
				targetProfileId: ownerId,
				callerProfileId: memberId,
			}),
		).toBe(false);
	});

	it("current cycle changes need dual confirmation", () => {
		expect(shouldRequireDualConfirmation("current_cycle")).toBe(true);
		expect(shouldRequireDualConfirmation("next_cycle")).toBe(false);
	});

	it("responder must be the other member", () => {
		expect(
			canRespondToProposal({
				proposedByProfileId: ownerId,
				responderProfileId: memberId,
			}),
		).toBe(true);
		expect(
			canRespondToProposal({
				proposedByProfileId: ownerId,
				responderProfileId: ownerId,
			}),
		).toBe(false);
	});
});
