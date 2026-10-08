export function readActionError(error: unknown, fallback: string): string {
	if (error && typeof error === "object" && "data" in error) {
		const data = error.data;
		if (typeof data === "string" && data.trim()) return data;
		if (data && typeof data === "object" && "message" in data) {
			const message = data.message;
			if (typeof message === "string" && message.trim()) return message;
		}
	}
	if (error instanceof Error && error.message.trim()) return error.message;
	return fallback;
}
