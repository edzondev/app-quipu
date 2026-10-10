import { useEffect, useState } from "react";
import { AppState } from "react-native";
import { limaStamp, limaStartOfDay } from "@/shared/lib/lima-date";

const MS_PER_DAY = 24 * 60 * 60 * 1000;

/**
 * Día de Lima de hoy, solo como llave de caché de las queries que dependen del reloj.
 * Cambia a medianoche (Lima) y al volver a primer plano. El servidor decide con su reloj.
 */
export function useLimaDayKey(): string {
	const [dayKey, setDayKey] = useState(() => limaStamp(Date.now()).key);

	useEffect(() => {
		let timer: ReturnType<typeof setTimeout> | undefined;
		const refresh = () => {
			clearTimeout(timer);
			const now = Date.now();
			setDayKey(limaStamp(now).key);
			timer = setTimeout(refresh, limaStartOfDay(now) + MS_PER_DAY - now);
		};
		refresh();
		const subscription = AppState.addEventListener("change", (state) => {
			if (state === "active") refresh();
		});
		return () => {
			clearTimeout(timer);
			subscription.remove();
		};
	}, []);

	return dayKey;
}
