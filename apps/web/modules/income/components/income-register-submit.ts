import type { FunctionArgs, FunctionReturnType } from "convex/server";
import type { api } from "@/convex/_generated/api";
import type { Doc } from "@/convex/_generated/dataModel";
import {
	AnalyticsEvents,
	mapDistributionPolicyToAllocationMode,
	mapExtraordinaryTypeToIncomeType,
	mapHabitualSourceToIncomeType,
	track,
	trackFinancialCycleTransition,
} from "@/core/analytics";
import { fromConvexError } from "@/core/errors";
import type { DistributionPolicy } from "@/shared/lib/allocations";
import type { ExtraordinaryType } from "@/shared/lib/extraordinaryIncome";
import { getIncomeSourceLabel } from "../constants";
import { buildIncomeAllocationPlan } from "../lib/buildAllocationPlan";
import {
	policyForExtraordinaryType,
	shouldSkipExtraordinaryConfirmation,
} from "../lib/extraordinaryPolicy";
import { buildIncomeDescription } from "../lib/incomeForm";
import type { IncomeRegisterFormValues } from "../schemas";
import type { IncomeRegisterResult } from "../types";

export type DashboardSummary = FunctionReturnType<typeof api.dashboard.getSummary>;

export type CreateIncomeEvent = (
	args: FunctionArgs<typeof api.incomeEvents.createIncomeEvent>,
) => Promise<IncomeRegisterResult>;

type SubmitIncomeRegistrationParams = {
	value: IncomeRegisterFormValues;
	profile: Doc<"profiles">;
	summary: DashboardSummary | undefined;
	createIncomeEvent: CreateIncomeEvent;
	onSuccess: (
		result: IncomeRegisterResult,
		options?: {
			incomeKind: "habitual" | "extraordinary";
			distributionPolicy?: DistributionPolicy;
		},
	) => void;
	requestDestinationConfirmation: () => void;
};

function extraTypeToExtraIncomeType(
	type: ExtraordinaryType | undefined,
): "gratification" | "cts" | "bonus" | "utilities" | "other" {
	if (type === "gratification_july" || type === "gratification_december") {
		return "gratification";
	}
	if (type === "cts") return "cts";
	if (type === "corporate_bonus") return "bonus";
	if (type === "profit_sharing") return "utilities";
	return "other";
}

function incomeDestinationEnvelope(
	incomeKind: "habitual" | "extraordinary",
	distributionPolicy: DistributionPolicy | undefined,
	allocations: { needs: number; wants: number; savings: number },
): "needs" | "wants" | "savings" {
	if (incomeKind === "extraordinary" && distributionPolicy === "all_to_savings") {
		return "savings";
	}
	if (allocations.needs >= allocations.wants && allocations.needs >= allocations.savings) {
		return "needs";
	}
	if (allocations.savings >= allocations.wants) {
		return "savings";
	}
	return "wants";
}

function buildReservations(params: { heldCents: number; summary: DashboardSummary | undefined }): {
	reservations: Array<{ commitmentId: string; amountCents: number }>;
	leaveUnallocatedCents: number;
} {
	const reservations: Array<{ commitmentId: string; amountCents: number }> = [];
	if (params.heldCents <= 0) {
		return { reservations, leaveUnallocatedCents: 0 };
	}
	if (!params.summary?.commitments?.length) {
		return { reservations, leaveUnallocatedCents: params.heldCents };
	}

	let remainingHold = params.heldCents;
	const uncovered = [...params.summary.commitments]
		.filter((commitment) => commitment.coverageStatus !== "covered" && commitment.remaining > 0)
		.sort((a, b) => a.daysUntilDue - b.daysUntilDue);
	for (const commitment of uncovered) {
		if (remainingHold <= 0) break;
		const take = Math.min(remainingHold, commitment.remaining);
		if (take <= 0) continue;
		reservations.push({
			commitmentId: commitment.id,
			amountCents: take,
		});
		remainingHold -= take;
	}

	return { reservations, leaveUnallocatedCents: remainingHold };
}

export async function submitIncomeRegistration(
	params: SubmitIncomeRegistrationParams,
): Promise<string | null> {
	const { value, profile, summary, createIncomeEvent, onSuccess } = params;
	try {
		if (value.incomeKind === "extraordinary") {
			const skipConfirmation = shouldSkipExtraordinaryConfirmation(
				profile.plan === "premium",
				value.extraordinaryType,
				profile.extraordinaryRules,
				profile.extraordinaryRulesAutoApply,
			);
			if (!value.distributionPolicy && !skipConfirmation) {
				params.requestDestinationConfirmation();
				return null;
			}

			const resolvedPolicy: DistributionPolicy =
				value.distributionPolicy ??
				(value.extraordinaryType
					? (policyForExtraordinaryType(value.extraordinaryType, profile.extraordinaryRules) ??
						"profile_default")
					: "profile_default");
			const { reservations, leaveUnallocatedCents } = buildReservations({
				heldCents: value.heldCents ?? 0,
				summary,
			});
			const allocation = buildIncomeAllocationPlan({
				amountCents: value.amountCents,
				weights: {
					allocationNeeds: profile.allocationNeeds,
					allocationWants: profile.allocationWants,
					allocationSavings: profile.allocationSavings,
				},
				reservations,
				leaveUnallocatedCents,
				distributionPolicy: resolvedPolicy,
			});
			const response = await createIncomeEvent({
				amount: value.amountCents,
				source: "payroll",
				description: "",
				occurredAt: value.occurredAt,
				incomeKind: "extraordinary",
				extraordinaryType: value.extraordinaryType,
				extraordinaryLabel:
					value.extraordinaryType === "custom"
						? (value.extraordinaryLabel ?? "").trim()
						: undefined,
				...(value.distributionPolicy ? { distributionPolicy: value.distributionPolicy } : {}),
				allocation: {
					reservations: allocation.reservations.map((row) => ({
						commitmentId: row.commitmentId as never,
						amountCents: row.amountCents,
					})),
					envelopes: allocation.envelopes,
					savingsContributions: allocation.savingsContributions.map((row) => ({
						amountCents: row.amountCents,
						kind: row.kind,
						subEnvelopeId: row.subEnvelopeId as never,
					})),
					leaveUnallocatedCents: allocation.leaveUnallocatedCents,
				},
			});
			track(AnalyticsEvents.INCOME_REGISTERED, {
				amount: value.amountCents,
				envelope: incomeDestinationEnvelope("extraordinary", value.distributionPolicy, {
					needs: profile.allocationNeeds,
					wants: profile.allocationWants,
					savings: profile.allocationSavings,
				}),
				income_kind: "extraordinary",
				income_type: mapExtraordinaryTypeToIncomeType(value.extraordinaryType),
				allocation_mode: mapDistributionPolicyToAllocationMode(value.distributionPolicy),
				cycle_id: response.cycleId,
				days_remaining_in_cycle: summary?.cycle?.daysRemaining,
				is_first_income: response.isNewCycle,
				used_explicit_allocation: true,
				reserved_cents: allocation.reservations.reduce((sum, row) => sum + row.amountCents, 0),
				unallocated_cents: allocation.leaveUnallocatedCents,
			});
			track(AnalyticsEvents.EXTRA_INCOME_REGISTERED, {
				amount: value.amountCents,
				type: extraTypeToExtraIncomeType(value.extraordinaryType),
				cycle_id: response.cycleId,
				distribution_policy: mapDistributionPolicyToAllocationMode(value.distributionPolicy),
			});
			if (response.isNewCycle) {
				trackFinancialCycleTransition(summary?.cycle?.id, response);
			}
			onSuccess(response, {
				incomeKind: "extraordinary",
				distributionPolicy: resolvedPolicy,
			});
			return null;
		}

		const description = buildIncomeDescription(getIncomeSourceLabel(value.source), value.concept);
		const { reservations, leaveUnallocatedCents } = buildReservations({
			heldCents: value.heldCents ?? 0,
			summary,
		});
		const allocation = buildIncomeAllocationPlan({
			amountCents: value.amountCents,
			weights: {
				allocationNeeds: profile.allocationNeeds,
				allocationWants: profile.allocationWants,
				allocationSavings: profile.allocationSavings,
			},
			reservations,
			leaveUnallocatedCents,
		});

		const response = await createIncomeEvent({
			amount: value.amountCents,
			source: value.source,
			description,
			occurredAt: value.occurredAt,
			incomeKind: "habitual",
			allocation: {
				reservations: allocation.reservations.map((row) => ({
					commitmentId: row.commitmentId as never,
					amountCents: row.amountCents,
				})),
				envelopes: allocation.envelopes,
				savingsContributions: allocation.savingsContributions.map((row) => ({
					amountCents: row.amountCents,
					kind: row.kind,
					subEnvelopeId: row.subEnvelopeId as never,
				})),
				leaveUnallocatedCents: allocation.leaveUnallocatedCents,
			},
		});
		track(AnalyticsEvents.INCOME_REGISTERED, {
			amount: value.amountCents,
			envelope: incomeDestinationEnvelope("habitual", undefined, {
				needs: profile.allocationNeeds,
				wants: profile.allocationWants,
				savings: profile.allocationSavings,
			}),
			income_kind: "habitual",
			income_type: mapHabitualSourceToIncomeType(value.source),
			allocation_mode: mapDistributionPolicyToAllocationMode(undefined),
			cycle_id: response.cycleId,
			days_remaining_in_cycle: summary?.cycle?.daysRemaining,
			is_first_income: response.isNewCycle,
			used_explicit_allocation: true,
			reserved_cents: allocation.reservations.reduce((sum, row) => sum + row.amountCents, 0),
			unallocated_cents: allocation.leaveUnallocatedCents,
		});
		if (response.isNewCycle) {
			trackFinancialCycleTransition(summary?.cycle?.id, response);
		}
		onSuccess(response, { incomeKind: "habitual" });
		return null;
	} catch (error) {
		return fromConvexError(error).message;
	}
}
