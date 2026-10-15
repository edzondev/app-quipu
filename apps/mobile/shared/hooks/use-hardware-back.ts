import { useCallback, useEffectEvent } from "react";
import { BackHandler } from "react-native";
import { useFocusEffect } from "@/shared/navigation/use-focus-effect";

/** Atrás de Android solo con la pantalla en foco; onBack no re-suscribe. */
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
