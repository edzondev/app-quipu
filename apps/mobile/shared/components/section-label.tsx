import type { ReactNode } from "react";
import { Text } from "react-native";

export function SectionLabel({ children, className }: { children: ReactNode; className?: string }) {
	return (
		<Text
			className={`font-geist-mono text-[10.5px] uppercase tracking-[0.14em] text-foreground/55${className ? ` ${className}` : ""}`}
		>
			{children}
		</Text>
	);
}
