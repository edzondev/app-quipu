import { useEffect, useState } from "react";

export function formatResendCountdown(seconds: number): string {
	const minutes = Math.floor(seconds / 60);
	const rest = seconds % 60;
	return `${minutes}:${String(rest).padStart(2, "0")}`;
}

export function useCountdown(initialSeconds: number) {
	const [seconds, setSeconds] = useState(initialSeconds);
	useEffect(() => {
		if (seconds <= 0) return;
		const t = setInterval(() => setSeconds((s) => s - 1), 1000);
		return () => clearInterval(t);
	}, [seconds]);
	return { seconds, reset: () => setSeconds(initialSeconds) };
}
