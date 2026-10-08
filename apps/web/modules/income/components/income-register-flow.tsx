"use client";

import { useMutation } from "convex/react";
import { useReducer } from "react";
import { api } from "@/convex/_generated/api";
import type { Doc } from "@/convex/_generated/dataModel";
import { DEFAULT_CURRENCY } from "@/core/constants";
import { useDashboardSummary } from "@/modules/dashboard/queries";
import { AnimatedView } from "@/shared/components/ui/animated-view";
import type { DistributionPolicy } from "@/shared/lib/allocations";
import type { IncomeFlowStep, IncomeRegisterResult } from "../types";
import { IncomeConfirmation } from "./income-confirmation";
import { IncomeRegisterForm } from "./income-register-form";
import { IncomeRegisterSkeleton } from "./income-register-skeleton";

type IncomeRegisterFlowProps = {
	profile: Doc<"profiles">;
	currencyCode: string;
};

type IncomeRegisterFlowState = {
	step: IncomeFlowStep;
	result: IncomeRegisterResult | undefined;
	successVariant: "habitual" | "extraordinary";
	showMoveSurplusLink: boolean;
	successDistributionPolicy: DistributionPolicy | undefined;
};

type IncomeRegisterFlowAction = {
	type: "success";
	result: IncomeRegisterResult;
	incomeKind: "habitual" | "extraordinary";
	distributionPolicy: DistributionPolicy | undefined;
};

const initialIncomeRegisterFlowState: IncomeRegisterFlowState = {
	step: "form",
	result: undefined,
	successVariant: "habitual",
	showMoveSurplusLink: false,
	successDistributionPolicy: undefined,
};

function incomeRegisterFlowReducer(
	state: IncomeRegisterFlowState,
	action: IncomeRegisterFlowAction,
): IncomeRegisterFlowState {
	switch (action.type) {
		case "success":
			return {
				...state,
				step: "success",
				result: action.result,
				successVariant: action.incomeKind,
				showMoveSurplusLink: action.incomeKind === "extraordinary",
				successDistributionPolicy: action.distributionPolicy,
			};
	}
}

export function IncomeRegisterFlow({
	profile,
	currencyCode: serverCurrencyCode,
}: IncomeRegisterFlowProps) {
	const summary = useDashboardSummary();
	const createIncomeEvent = useMutation(api.incomeEvents.createIncomeEvent);

	const [
		{ step, result, successVariant, showMoveSurplusLink, successDistributionPolicy },
		dispatch,
	] = useReducer(incomeRegisterFlowReducer, initialIncomeRegisterFlowState);

	const currencyCode = summary?.profile.currencyCode ?? serverCurrencyCode ?? DEFAULT_CURRENCY.code;

	if (summary === undefined) {
		return <IncomeRegisterSkeleton />;
	}

	return (
		<AnimatedView viewKey={step} direction="forward" aria-live="polite">
			{step === "success" && result ? (
				<IncomeConfirmation
					result={result}
					currencyCode={currencyCode}
					variant={successVariant}
					distributionPolicy={successDistributionPolicy}
					showMoveSurplusLink={showMoveSurplusLink}
				/>
			) : (
				<IncomeRegisterForm
					currencyCode={currencyCode}
					profile={profile}
					summary={summary}
					createIncomeEvent={createIncomeEvent}
					onSuccess={(response, options) => {
						dispatch({
							type: "success",
							result: response,
							incomeKind: options?.incomeKind ?? "habitual",
							distributionPolicy: options?.distributionPolicy,
						});
					}}
				/>
			)}
		</AnimatedView>
	);
}
