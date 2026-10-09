import { RNHostView } from "@expo/ui";
import type { ReactNode } from "react";
import { ScrollView } from "react-native";

/**
 * Contenido RN en un BottomSheet con `snapPoints={['full']}`.
 * El host llena el detent nativo; el ScrollView de RN scrollea el overflow
 * (el ScrollView de @expo/ui no arrastra bien un árbol RN anidado).
 */
export function SheetHost({ children }: { children: ReactNode }) {
	return (
		<RNHostView>
			<ScrollView
				className="flex-1"
				contentContainerClassName="grow pb-3"
				keyboardShouldPersistTaps="handled"
				showsVerticalScrollIndicator={false}
				bounces
			>
				{children}
			</ScrollView>
		</RNHostView>
	);
}
