import { BagSmile } from "reicon-react/icons/BagSmile";
import { Check } from "reicon-react/icons/Check";
import { Home } from "reicon-react/icons/Home";
import {
	COVERAGE_COVERED_HEADER,
	COVERAGE_UNCOVERED_HEADER,
	ENVELOPE_LABELS,
	formatDueInDays,
} from "@/shared/constants/commitments";
import { formatCommitmentStatusLines } from "@/shared/lib/commitmentStatusDisplay";
import { formatCents } from "@/shared/lib/money";

export type CommitmentCoverageItem = {
	id: string;
	name: string;
	amount: number;
	envelope: "needs" | "wants";
	daysUntilDue: number;
	nextDueAt?: number;
	coverageStatus: "covered" | "partial" | "uncovered";
	cascadeStatus?: "covered" | "partial" | "not-started" | "overdue";
	paymentStatus?: "paid" | "pending" | "overdue";
	paidAtForCycle?: number;
	progressPercent: number;
};

type Props = {
	commitments: CommitmentCoverageItem[];
	currencyCode: string;
	showCoverageHeader?: boolean;
	onCommitmentClick?: (commitment: CommitmentCoverageItem) => void;
};

function CommitmentIcon({ envelope }: { envelope: "needs" | "wants" }) {
	if (envelope === "wants") {
		return (
			<span className="flex size-8 items-center justify-center rounded-[9px] bg-clay-soft">
				<BagSmile size={14} color="var(--clay)" className="shrink-0" aria-hidden />
			</span>
		);
	}

	return (
		<span className="flex size-8 items-center justify-center rounded-[9px] bg-steel-soft">
			<Home size={14} color="var(--steel)" className="shrink-0" aria-hidden />
		</span>
	);
}

function formatCoverageHint(commitment: CommitmentCoverageItem): string {
	if (commitment.coverageStatus === "covered") return "";
	if (commitment.cascadeStatus === "overdue") return " · vencido";
	if (commitment.coverageStatus === "partial") return " · parcial";
	return " · sin cubrir";
}

function CommitmentStatusLines({ commitment }: { commitment: CommitmentCoverageItem }) {
	if (!commitment.paymentStatus) return null;

	const lines = formatCommitmentStatusLines({
		coverageStatus: commitment.coverageStatus,
		paymentStatus: commitment.paymentStatus,
		paidAtForCycle: commitment.paidAtForCycle,
		daysUntilDue: commitment.daysUntilDue,
	});

	return (
		<div className="mt-0.5 space-y-0.5">
			{lines.map((line) => (
				<div
					key={line}
					className={`text-[11px] leading-snug ${
						line === "Vencido"
							? "font-medium text-danger-ink"
							: line.startsWith("Pagado")
								? "text-qp-deep"
								: "text-mute"
					}`}
				>
					{line}
				</div>
			))}
		</div>
	);
}

function CommitmentProgress({ progressPercent }: { progressPercent: number }) {
	return (
		<div className="mt-1.5 h-1 w-full overflow-hidden rounded-full bg-surface-warm" aria-hidden>
			<div
				className="h-full rounded-full bg-qp transition-[width]"
				style={{ width: `${progressPercent}%` }}
			/>
		</div>
	);
}

function allCommitmentsCovered(commitments: CommitmentCoverageItem[]): boolean {
	if (commitments.length === 0) return true;
	return commitments.every((item) => item.coverageStatus === "covered");
}

export function CommitmentCoverageList({
	commitments,
	currencyCode,
	showCoverageHeader = false,
	onCommitmentClick,
}: Props) {
	const covered = allCommitmentsCovered(commitments);

	return (
		<>
			{showCoverageHeader ? (
				<div className="flex items-center justify-end gap-3 border-b border-line-divider px-4 py-3 md:px-[18px]">
					<span className="inline-flex items-center gap-1.5 text-xs font-semibold text-qp-deep">
						{covered ? (
							<>
								<span className="flex size-4 items-center justify-center rounded-full bg-qp-soft">
									<Check size={10} color="var(--qp)" strokeWidth={3} aria-hidden />
								</span>
								{COVERAGE_COVERED_HEADER}
							</>
						) : (
							COVERAGE_UNCOVERED_HEADER
						)}
					</span>
				</div>
			) : null}

			<ul>
				{commitments.map((commitment, index) => (
					<li
						key={commitment.id}
						className={`flex items-center gap-3 px-4 py-2.5 md:px-[18px] md:py-3 ${
							index < commitments.length - 1 ? "border-b border-line-divider" : ""
						} ${onCommitmentClick ? "cursor-pointer hover:bg-surface-warm/80" : ""}`}
					>
						<button
							type="button"
							className="flex min-w-0 flex-1 items-center gap-3 text-left"
							onClick={onCommitmentClick ? () => onCommitmentClick(commitment) : undefined}
							disabled={!onCommitmentClick}
						>
							<CommitmentIcon envelope={commitment.envelope} />
							<div className="min-w-0 flex-1">
								<div className="truncate text-[13.5px] font-semibold text-ink">
									{commitment.name}
								</div>
								<div className="text-[11.5px] text-mute">
									{formatDueInDays(commitment.daysUntilDue)} ·{" "}
									{ENVELOPE_LABELS[commitment.envelope]}
									{formatCoverageHint(commitment)}
								</div>
								<CommitmentStatusLines commitment={commitment} />
								{commitment.coverageStatus !== "covered" ? (
									<CommitmentProgress progressPercent={commitment.progressPercent} />
								) : null}
							</div>
							<div className="shrink-0 text-right">
								<span className="font-serif text-base text-ink">
									{formatCents(commitment.amount, { currency: currencyCode })}
								</span>
								{commitment.coverageStatus === "partial" ? (
									<div className="text-[10.5px] text-mute">
										{commitment.progressPercent}% cubierto
									</div>
								) : null}
							</div>
						</button>
					</li>
				))}
			</ul>
		</>
	);
}
