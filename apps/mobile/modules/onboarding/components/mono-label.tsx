import type { ReactNode } from "react";
import { Text } from "react-native";

const BASE_CLASS = "font-geist-mono text-[10.5px] tracking-[0.18em] text-foreground/45 uppercase";

/** Label mono uppercase en 10.5px con tracking, usado en todos los pasos. */
export function MonoLabel({ children, className }: { children: ReactNode; className?: string }) {
	return <Text className={className ? `${BASE_CLASS} ${className}` : BASE_CLASS}>{children}</Text>;
}
