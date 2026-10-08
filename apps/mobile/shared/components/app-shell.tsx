import type { PropsWithChildren } from "react";
import {
	type SafeAreaViewProps,
	SafeAreaView as SafeAreaViewRN,
} from "react-native-safe-area-context";
import { withUniwind } from "uniwind";

type Props = SafeAreaViewProps & PropsWithChildren;

const SafeAreaView = withUniwind(SafeAreaViewRN);

export default function AppShell({ children, edges = ["top"], className, ...props }: Props) {
	return (
		<SafeAreaView
			className={`flex-1 py-6 px-5.5 bg-background ${className}`}
			edges={edges}
			mode="padding"
			{...props}
		>
			{children}
		</SafeAreaView>
	);
}
