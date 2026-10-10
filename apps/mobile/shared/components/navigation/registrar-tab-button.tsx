import type { BottomTabBarButtonProps } from "expo-router/tabs";
import { Pressable } from "react-native";
import { Add } from "reicon-react-native/icons/Add";

type Props = BottomTabBarButtonProps & {
	/** Acción personalizada del FAB. Si se omite, no hace nada. */
	onPress?: () => void;
};

/**
 * FAB central elevada. Ignora el `onPress` del slot (que navegaría
 * al tab "registrar") y dispara su propia acción — abrir el bottom
 * sheet de "Registrar gasto".
 */
export default function RegistrarTabButton({ onPress: customOnPress, ...props }: Props) {
	return (
		<Pressable
			testID="registrar-fab"
			accessibilityRole="button"
			accessibilityLabel="Registrar"
			accessibilityState={props.accessibilityState}
			onPress={(e) => {
				// Evita la navegación al tab "registrar" del navigator.
				e.preventDefault?.();
				customOnPress?.();
			}}
			className="absolute -top-5 left-1/2 -ml-7 h-14 w-14 items-center justify-center rounded-full bg-foreground"
			style={{
				boxShadow: "0 6px 14px rgba(0, 0, 0, 0.18)",
			}}
		>
			<Add size={26} color="#FFFFFF" strokeWidth={2} />
		</Pressable>
	);
}
