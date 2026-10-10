const limaTime = new Intl.DateTimeFormat("es-PE", {
	timeZone: "America/Lima",
	year: "numeric",
	month: "2-digit",
	day: "2-digit",
	hour: "2-digit",
	minute: "2-digit",
});

export function formatPostedAtLima(postedAt: number): string {
	return limaTime.format(postedAt);
}

export function truncateProbeText(text: string, max = 80): string {
	const flat = text.replace(/\s+/g, " ").trim();
	if (flat.length <= max) return flat;
	return `${flat.slice(0, max)}…`;
}
