import { useFocusEffect } from "expo-router";
import { useCallback, useEffectEvent } from "react";
import { BackHandler } from "react-native";

/** Atrás de Android mientras la pantalla tiene foco; onBack no re-suscribe. */
export function useHardwareBack(onBack: () => void) {
	const handleBack = useEffectEvent(() => {
		onBack();
		return true as const;
	});

	useFocusEffect(
		useCallback(() => {
			const subscription = BackHandler.addEventListener("hardwareBackPress", () => handleBack());
			return () => subscription.remove();
		}, []),
	);
}
