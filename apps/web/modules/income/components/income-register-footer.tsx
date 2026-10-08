import type { ComponentProps, ReactNode } from "react";
import type { DistributionPolicy } from "@/shared/lib/allocations";
import type { ExtraordinaryType } from "@/shared/lib/extraordinaryIncome";
import { IncomeDestinationDialog } from "./income-destination-dialog";

type IncomeRegisterFooterProps = {
	showDestinationDialog: boolean;
	destinationOpen: boolean;
	extraordinaryType: ExtraordinaryType | undefined;
	amountCents: number;
	currencyCode: string;
	preview: ComponentProps<typeof IncomeDestinationDialog>["preview"];
	distributionPolicy: DistributionPolicy | undefined;
	serverError: string | null;
	actions: ReactNode;
	onDestinationOpenChange: (open: boolean) => void;
	onConfirmDestination: (policy: DistributionPolicy) => void;
};

export function IncomeRegisterFooter({
	showDestinationDialog,
	destinationOpen,
	extraordinaryType,
	amountCents,
	currencyCode,
	preview,
	distributionPolicy,
	serverError,
	actions,
	onDestinationOpenChange,
	onConfirmDestination,
}: IncomeRegisterFooterProps) {
	return (
		<>
			{showDestinationDialog && extraordinaryType ? (
				<IncomeDestinationDialog
					open={destinationOpen}
					onOpenChange={onDestinationOpenChange}
					extraordinaryType={extraordinaryType}
					amountCents={amountCents}
					currencyCode={currencyCode}
					preview={preview}
					value={distributionPolicy}
					onConfirm={onConfirmDestination}
				/>
			) : null}

			{serverError ? (
				<p className="mt-4 text-sm text-danger" role="alert">
					{serverError}
				</p>
			) : null}

			{actions}
		</>
	);
}
