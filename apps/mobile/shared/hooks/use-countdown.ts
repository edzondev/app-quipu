import { useEffect, useState } from "react";

export function useCountdown(initialSeconds: number) {
	const [seconds, setSeconds] = useState(initialSeconds);
	useEffect(() => {
		if (seconds <= 0) return;
		const t = setInterval(() => setSeconds((s) => s - 1), 1000);
		return () => clearInterval(t);
	}, [seconds]);
	return { seconds, reset: () => setSeconds(initialSeconds) };
}
