import { Button } from "@/shared/components/ui/button";
import type { ExtraordinaryType } from "@/shared/lib/extraordinaryIncome";
import {
	INCOME_EXTRAORDINARY_CONTINUE_CTA,
	INCOME_EXTRAORDINARY_PICK_HINT,
	INCOME_EXTRAORDINARY_TYPE_SECTION,
} from "../constants";
import { IncomeExtraordinaryTypeGrid } from "./income-extraordinary-type-grid";

type IncomeExtraordinaryPickStepProps = {
	value: ExtraordinaryType | undefined;
	error: string | undefined;
	onChangeType: (type: ExtraordinaryType) => void;
	onMissingType: () => void;
	onContinue: () => void;
};

export function IncomeExtraordinaryPickStep({
	value,
	error,
	onChangeType,
	onMissingType,
	onContinue,
}: IncomeExtraordinaryPickStepProps) {
	return (
		<>
			<p className="mb-3 font-mono text-[10.5px] tracking-[0.1em] text-mute uppercase">
				{INCOME_EXTRAORDINARY_TYPE_SECTION}
			</p>
			<IncomeExtraordinaryTypeGrid value={value} onChange={onChangeType} error={error} />
			<div className="mt-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
				<p className="text-[12.5px] text-mute">{INCOME_EXTRAORDINARY_PICK_HINT}</p>
				<Button
					type="button"
					className="h-[46px] rounded-[11px] bg-ink px-[26px] text-[14.5px] font-semibold text-canvas"
					onClick={() => {
						if (!value) {
							onMissingType();
							return;
						}
						onContinue();
					}}
				>
					{INCOME_EXTRAORDINARY_CONTINUE_CTA}
				</Button>
			</div>
		</>
	);
}
