"use client";

import { useForm } from "@tanstack/react-form";
import { useMemo, useRef, useState } from "react";
import type { Doc } from "@/convex/_generated/dataModel";
import { AppPageShell } from "@/shared/components/layout/app-page-shell";
import { AnimatedView } from "@/shared/components/ui/animated-view";
import type { DistributionPolicy } from "@/shared/lib/allocations";
import { limaStartOfDay } from "@/shared/lib/date";
import type { ExtraordinaryType } from "@/shared/lib/extraordinaryIncome";
import {
	getExtraordinarySubmitCta,
	INCOME_EXTRAORDINARY_DETAILS_SUBTITLE,
	INCOME_PAGE_SUBTITLE,
	INCOME_PAGE_SUBTITLE_KIND,
	INCOME_SUBMIT_CTA,
} from "../constants";
import { policyForExtraordinaryType } from "../lib/extraordinaryPolicy";
import {
	computeImpactPreview,
	resolveCycleDaysForPreview,
	suggestHeldCentsForPreview,
} from "../lib/impactPreview";
import { createIncomeRegisterSchema } from "../schemas";
import type { IncomeRegisterResult, IncomeSource } from "../types";
import { IncomeExtraordinaryPickStep } from "./income-extraordinary-pick-step";
import { IncomeKindToggle } from "./income-kind-toggle";
import { IncomeRegisterActions } from "./income-register-actions";
import {
	IncomeRegisterFieldsSection,
	type IncomeRegisterFormApi,
	type IncomeRegisterFormData,
} from "./income-register-fields-section";
import { IncomeRegisterFooter } from "./income-register-footer";
import {
	type CreateIncomeEvent,
	type DashboardSummary,
	submitIncomeRegistration,
} from "./income-register-submit";
import { IncomeRegisterTitle } from "./income-register-title";

type ExtraStep = "pickType" | "details";

type Props = {
	currencyCode: string;
	profile: Doc<"profiles">;
	summary: DashboardSummary | undefined;
	onSuccess: (
		result: IncomeRegisterResult,
		options?: {
			incomeKind: "habitual" | "extraordinary";
			distributionPolicy?: DistributionPolicy;
		},
	) => void;
	createIncomeEvent: CreateIncomeEvent;
};

const silentSet = { dontValidate: true } as const;

export function IncomeRegisterForm({
	currencyCode,
	profile,
	summary,
	onSuccess,
	createIncomeEvent,
}: Props) {
	const [serverError, setServerError] = useState<string | null>(null);
	const [extraStep, setExtraStep] = useState<ExtraStep>("pickType");
	const [destinationOpen, setDestinationOpen] = useState(false);
	const destinationSubmitAfterConfirmRef = useRef(false);
	const [pickTypeError, setPickTypeError] = useState<string | null>(null);
	const formSchema = useMemo(() => createIncomeRegisterSchema(), []);

	const form: IncomeRegisterFormApi = useForm({
		defaultValues: {
			incomeKind: "habitual" as "habitual" | "extraordinary",
			amountCents: 0,
			source: "payroll" as IncomeSource,
			concept: "",
			occurredAt: limaStartOfDay(),
			extraordinaryType: undefined as ExtraordinaryType | undefined,
			extraordinaryLabel: "",
			distributionPolicy: undefined as DistributionPolicy | undefined,
			heldCents: 0,
		} satisfies IncomeRegisterFormData,
		validators: {
			onSubmit: ({ value }) => {
				const parsed = formSchema.safeParse(value);
				if (parsed.success) return undefined;
				return parsed.error.issues[0]?.message ?? "Revisa el formulario.";
			},
		},
		onSubmit: async ({ value }) => {
			setServerError(null);
			const submitError = await submitIncomeRegistration({
				value,
				profile,
				summary,
				createIncomeEvent,
				onSuccess,
				requestDestinationConfirmation: () => {
					destinationSubmitAfterConfirmRef.current = true;
					setDestinationOpen(true);
				},
			});
			if (submitError) {
				setServerError(submitError);
			}
		},
	});

	const resetExtraordinary = () => {
		setExtraStep("pickType");
		setPickTypeError(null);
		form.setFieldValue("extraordinaryType", undefined, silentSet);
		form.setFieldValue("extraordinaryLabel", "", silentSet);
		form.setFieldValue("distributionPolicy", undefined, silentSet);
		form.setFieldValue("heldCents", 0, silentSet);
	};

	return (
		<AppPageShell maxWidth="2xl" breadcrumbs="auto">
			<form
				className="w-full"
				onSubmit={(event) => {
					event.preventDefault();
					event.stopPropagation();
					void form.handleSubmit();
				}}
			>
				<form.Subscribe selector={(state) => state.values}>
					{(values) => {
						const isExtraordinary = values.incomeKind === "extraordinary";
						const showPick = isExtraordinary && extraStep === "pickType";
						const showDetails =
							isExtraordinary && extraStep === "details" && values.extraordinaryType;
						const showFormCtas = !isExtraordinary || Boolean(showDetails);

						const subtitle = isExtraordinary
							? showPick
								? INCOME_PAGE_SUBTITLE_KIND
								: INCOME_EXTRAORDINARY_DETAILS_SUBTITLE
							: INCOME_PAGE_SUBTITLE;

						// P3-4: suggestion from uncovered commitment remainders.
						const uncoveredSum =
							summary?.commitments?.reduce((sum, c) => {
								const isUncovered =
									c.cascadeStatus === "partial" ||
									c.cascadeStatus === "not-started" ||
									c.cascadeStatus === "overdue";
								return sum + (isUncovered ? c.remaining : 0);
							}, 0) ?? 0;
						const suggestedHeldCents =
							values.amountCents > 0 && uncoveredSum > 0
								? suggestHeldCentsForPreview(values.amountCents, uncoveredSum)
								: undefined;

						const previewInput =
							values.amountCents > 0
								? computeImpactPreview({
										amountCents: values.amountCents,
										weights: {
											allocationNeeds: profile.allocationNeeds,
											allocationWants: profile.allocationWants,
											allocationSavings: profile.allocationSavings,
										},
										currentEnvelopes: {
											needs:
												summary?.envelopes?.find((e) => e.type === "needs")?.remainingAmount ?? 0,
											wants:
												summary?.envelopes?.find((e) => e.type === "wants")?.remainingAmount ?? 0,
											savings:
												summary?.envelopes?.find((e) => e.type === "savings")?.remainingAmount ?? 0,
										},
										daysRemaining:
											summary?.cycle?.daysRemaining ??
											resolveCycleDaysForPreview({
												incomeModel: profile.incomeModel,
												payFrequency: profile.payFrequency,
												cycleDurationDays: profile.cycleDurationDays,
											}),
										distributionPolicy: isExtraordinary ? values.distributionPolicy : undefined,
										heldCents: values.heldCents ?? 0,
									})
								: null;

						const submitLabel =
							isExtraordinary && values.extraordinaryType
								? getExtraordinarySubmitCta(values.extraordinaryType)
								: INCOME_SUBMIT_CTA;

						const contentViewKey = isExtraordinary ? extraStep : "habitual";

						return (
							<>
								<IncomeRegisterTitle showDetails={Boolean(showDetails)} subtitle={subtitle} />

								<div className="mb-6">
									<IncomeKindToggle
										value={values.incomeKind}
										onChange={(kind) => {
											form.setFieldValue("incomeKind", kind);
											if (kind === "habitual") resetExtraordinary();
											else setExtraStep("pickType");
										}}
									/>
								</div>

								<AnimatedView viewKey={contentViewKey} direction="forward">
									{showPick ? (
										<IncomeExtraordinaryPickStep
											value={values.extraordinaryType}
											error={pickTypeError ?? undefined}
											onChangeType={(type) => {
												setPickTypeError(null);
												form.setFieldValue("extraordinaryType", type);
												form.setFieldValue(
													"distributionPolicy",
													policyForExtraordinaryType(type, profile.extraordinaryRules),
													silentSet,
												);
											}}
											onMissingType={() =>
												setPickTypeError("Elige un tipo de ingreso extraordinario.")
											}
											onContinue={() => setExtraStep("details")}
										/>
									) : null}

									<IncomeRegisterFieldsSection
										form={form}
										profile={profile}
										values={values}
										isExtraordinary={isExtraordinary}
										showDetails={showDetails}
										currencyCode={currencyCode}
										preview={previewInput}
										suggestedHeldCents={suggestedHeldCents}
										onChangeDestination={() => {
											destinationSubmitAfterConfirmRef.current = false;
											setDestinationOpen(true);
										}}
									/>

									<IncomeRegisterFooter
										showDestinationDialog={Boolean(showDetails)}
										destinationOpen={destinationOpen}
										extraordinaryType={values.extraordinaryType}
										amountCents={values.amountCents}
										currencyCode={currencyCode}
										preview={previewInput}
										distributionPolicy={values.distributionPolicy}
										serverError={serverError}
										onDestinationOpenChange={setDestinationOpen}
										onConfirmDestination={(policy) => {
											form.setFieldValue("distributionPolicy", policy);
											if (destinationSubmitAfterConfirmRef.current) {
												destinationSubmitAfterConfirmRef.current = false;
												void form.handleSubmit();
											}
										}}
										actions={
											showFormCtas ? (
												<form.Subscribe
													selector={(state) => [state.canSubmit, state.isSubmitting] as const}
												>
													{([canSubmit, isSubmitting]) => (
														<IncomeRegisterActions
															canSubmit={canSubmit}
															isSubmitting={isSubmitting}
															submitLabel={submitLabel}
														/>
													)}
												</form.Subscribe>
											) : null
										}
									/>
								</AnimatedView>
							</>
						);
					}}
				</form.Subscribe>
			</form>
		</AppPageShell>
	);
}
