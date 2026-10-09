import { useConvexConnectionState } from "convex/react";
import { useEffect, useState } from "react";
import { Text, View } from "react-native";
import Animated, { Easing, FadeInDown, FadeOut } from "react-native-reanimated";
import { WifiOff } from "@/shared/components/ui/reicon";

export const OFFLINE_BANNER_DEBOUNCE_MS = 500;

const ENTER = FadeInDown.duration(180)
	.easing(Easing.bezier(0.23, 1, 0.32, 1))
	.withInitialValues({ opacity: 0, transform: [{ translateY: -6 }] });

const EXIT = FadeOut.duration(160).easing(Easing.bezier(0.23, 1, 0.32, 1));

function useOfflineBannerVisible() {
	const connection = useConvexConnectionState();
	// El primer intento en curso no es un corte: hace falta haber conectado o un reintento fallido.
	const offline =
		!connection.isWebSocketConnected &&
		(connection.hasEverConnected || connection.connectionRetries > 0);
	const [visible, setVisible] = useState(false);

	useEffect(() => {
		if (!offline) {
			setVisible(false);
			return;
		}

		const timeout = setTimeout(() => {
			setVisible(true);
		}, OFFLINE_BANNER_DEBOUNCE_MS);

		return () => {
			clearTimeout(timeout);
		};
	}, [offline]);

	return visible;
}

export function OfflineBanner() {
	const visible = useOfflineBannerVisible();
	if (!visible) return null;

	return (
		<Animated.View entering={ENTER} exiting={EXIT}>
			<View
				accessibilityLabel="Sin conexión"
				accessibilityLiveRegion="polite"
				accessibilityRole="text"
				className="flex-row items-center gap-2.5 rounded-xl bg-warning/12 px-3.5 py-2.5"
			>
				<WifiOff colorClassName="accent-warning-foreground" size={15} strokeWidth={1.8} />
				<Text className="font-hanken-semibold text-[12.5px] leading-[16px] text-warning-foreground">
					Sin conexión
				</Text>
			</View>
		</Animated.View>
	);
}
