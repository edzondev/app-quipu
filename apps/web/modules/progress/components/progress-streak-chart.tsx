import type { ProgressChartBar } from "../types";

type Props = {
	bars: ProgressChartBar[];
};

export function ProgressStreakChart({ bars }: Props) {
	return (
		<div
			className="flex items-end gap-[5px] md:gap-[7px]"
			role="img"
			aria-label="Historial de cumplimiento de los últimos ciclos"
		>
			{bars.map((bar) => {
				if (bar.status === "empty") {
					return (
						<span
							key={bar.id}
							className="w-[11px] rounded-[3px] bg-transparent md:w-3.5 md:rounded"
							style={{ height: 0 }}
						/>
					);
				}
				if (bar.status === "current") {
					return (
						<span
							key={bar.id}
							className="w-[11px] rounded-[3px] bg-[repeating-linear-gradient(-45deg,var(--qp),var(--qp)_3px,transparent_3px,transparent_6px)] md:w-3.5 md:rounded"
							style={{ height: bar.heightPx }}
						/>
					);
				}
				const color = bar.status === "compliant" ? "bg-qp" : "bg-[#E7E3DC]";
				return (
					<span
						key={bar.id}
						className={`w-[11px] rounded-[3px] md:w-3.5 md:rounded ${color}`}
						style={{ height: bar.heightPx }}
					/>
				);
			})}
		</div>
	);
}
