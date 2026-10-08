import { INCOME_PAGE_TITLE } from "../constants";

type IncomeRegisterTitleProps = {
	showDetails: boolean;
	subtitle: string;
};

export function IncomeRegisterTitle({ showDetails, subtitle }: IncomeRegisterTitleProps) {
	if (showDetails) return null;

	return (
		<>
			<div className="mb-6 hidden md:mb-8 md:block">
				<h1 className="font-serif text-[27px] font-medium text-ink">{INCOME_PAGE_TITLE}</h1>
				<p className="mt-1 text-[13.5px] text-mute">{subtitle}</p>
			</div>

			<p className="mb-4 text-[13px] text-mute md:hidden">{subtitle}</p>
		</>
	);
}
