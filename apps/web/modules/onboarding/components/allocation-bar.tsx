type Props = { needs: number; wants: number; savings: number };

export function AllocationBar({ needs, wants, savings }: Props) {
	return (
		<div className="flex h-4 overflow-hidden rounded-lg ring-1 ring-inset ring-black/5">
			<div className="bg-needs transition-[width]" style={{ width: `${needs}%` }} />
			<div className="bg-clay transition-[width]" style={{ width: `${wants}%` }} />
			<div className="bg-moss transition-[width]" style={{ width: `${savings}%` }} />
		</div>
	);
}
