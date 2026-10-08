type MinimalCycle = { _id: string; startDate: number; endDate: number };

export function resolveCycleForEvent(input: {
	activeCycle: MinimalCycle | null;
	occurredAt: number;
	now: number;
}): string | null {
	if (!input.activeCycle) return null;
	const { startDate, endDate } = input.activeCycle;
	if (input.occurredAt >= startDate && input.occurredAt < endDate) {
		return input.activeCycle._id;
	}
	return null;
}
