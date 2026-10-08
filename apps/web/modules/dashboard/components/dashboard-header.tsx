import { DashboardHeaderActions } from "./dashboard-header-actions";

type Props = {
	name: string;
	cycleDayLine?: string | null;
};

export function DashboardHeader({ name, cycleDayLine }: Props) {
	return (
		<header className="mb-4 md:mb-6">
			<div className="md:flex md:items-end md:justify-between md:gap-4">
				<div className="min-w-0">
					<h1 className="font-serif text-[22px] font-medium leading-tight text-ink md:text-[27px]">
						Hola, {name}
					</h1>
					{cycleDayLine ? (
						<p className="mt-0.5 text-[12.5px] font-medium text-ink-secondary md:text-[13px]">
							{cycleDayLine}
						</p>
					) : null}
				</div>

				<div className="hidden shrink-0 md:block">
					<DashboardHeaderActions layout="desktop" />
				</div>
			</div>

			<div className="mt-3 md:hidden">
				<DashboardHeaderActions layout="mobile" />
			</div>
		</header>
	);
}
