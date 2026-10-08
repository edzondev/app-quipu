import type { ReactFormExtendedApi } from "@tanstack/react-form";
import type { Doc } from "@/convex/_generated/dataModel";
import type { DistributionPolicy } from "@/shared/lib/allocations";
import type { ExtraordinaryType } from "@/shared/lib/extraordinaryIncome";
import { cn } from "@/shared/lib/utils";
import type { IncomeSource } from "../types";
import { IncomeExtraordinaryDetailsFields } from "./income-extraordinary-details-fields";
import { IncomeExtraordinaryRuleBanner } from "./income-extraordinary-rule-banner";
import type { IncomeFormField } from "./income-form-field";
import { IncomeImpactPreview } from "./income-impact-preview";
import { IncomeRegisterHabitualFields } from "./income-register-habitual-fields";

export type IncomeRegisterFormData = {
	incomeKind: "habitual" | "extraordinary";
	amountCents: number;
	source: IncomeSource;
	concept: string;
	occurredAt: number;
	extraordinaryType: ExtraordinaryType | undefined;
	extraordinaryLabel: string;
	distributionPolicy: DistributionPolicy | undefined;
	heldCents: number;
};

type IncomeRegisterFormValidator = (props: { value: IncomeRegisterFormData }) => string | undefined;

export type IncomeRegisterFormApi = ReactFormExtendedApi<
	IncomeRegisterFormData,
	undefined,
	undefined,
	undefined,
	undefined,
	undefined,
	IncomeRegisterFormValidator,
	undefined,
	undefined,
	undefined,
	undefined,
	unknown
>;

type IncomeRegisterFieldsSectionProps = {
	form: IncomeRegisterFormApi;
	profile: Doc<"profiles">;
	values: IncomeRegisterFormData;
	isExtraordinary: boolean;
	showDetails: ExtraordinaryType | false | undefined;
	currencyCode: string;
	preview: Parameters<typeof IncomeImpactPreview>[0]["preview"];
	suggestedHeldCents: number | undefined;
	onChangeDestination: () => void;
};

export function IncomeRegisterFieldsSection({
	form,
	profile,
	values,
	isExtraordinary,
	showDetails,
	currencyCode,
	preview,
	suggestedHeldCents,
	onChangeDestination,
}: IncomeRegisterFieldsSectionProps) {
	if (isExtraordinary && !showDetails) return null;

	return (
		<div
			className={cn(
				"grid gap-6 xl:grid-cols-[1fr_min(320px,100%)] xl:gap-7",
				showDetails && "mt-2",
			)}
		>
			<div className="space-y-5">
				{showDetails ? (
					<form.Field name="amountCents">
						{(amountField) => (
							<form.Field name="occurredAt">
								{(occurredAtField) => (
									<form.Field name="extraordinaryLabel">
										{(labelField) => (
											<form.Field name="heldCents">
												{(heldField) => (
													<IncomeExtraordinaryDetailsFields
														currencyCode={currencyCode}
														extraordinaryType={showDetails}
														amountField={amountField}
														occurredAtField={occurredAtField}
														labelField={labelField as IncomeFormField<"extraordinaryLabel">}
														heldField={heldField as IncomeFormField<"heldCents">}
														suggestedHeldCents={suggestedHeldCents}
													/>
												)}
											</form.Field>
										)}
									</form.Field>
								)}
							</form.Field>
						)}
					</form.Field>
				) : (
					<form.Field name="amountCents">
						{(amountField) => (
							<form.Field name="occurredAt">
								{(occurredAtField) => (
									<form.Field name="source">
										{(sourceField) => (
											<form.Field name="concept">
												{(conceptField) => (
													<form.Field name="heldCents">
														{(heldField) => (
															<IncomeRegisterHabitualFields
																currencyCode={currencyCode}
																amountField={amountField}
																occurredAtField={occurredAtField}
																sourceField={sourceField}
																conceptField={conceptField}
																heldField={heldField as IncomeFormField<"heldCents">}
																suggestedHeldCents={suggestedHeldCents}
															/>
														)}
													</form.Field>
												)}
											</form.Field>
										)}
									</form.Field>
								)}
							</form.Field>
						)}
					</form.Field>
				)}
			</div>

			<div className="flex flex-col gap-3.5">
				{showDetails && values.extraordinaryType ? (
					<IncomeExtraordinaryRuleBanner
						extraordinaryType={values.extraordinaryType}
						profileRules={profile.extraordinaryRules}
						allocationNeeds={profile.allocationNeeds}
						allocationWants={profile.allocationWants}
						allocationSavings={profile.allocationSavings}
						onChangeDestination={onChangeDestination}
					/>
				) : null}
				<IncomeImpactPreview
					preview={preview}
					currencyCode={currencyCode}
					moveSurplusHref={showDetails ? "/savings/move?from=wants" : undefined}
				/>
			</div>
		</div>
	);
}
