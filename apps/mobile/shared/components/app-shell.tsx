import { createContext, type PropsWithChildren, useContext } from "react";
import {
	type SafeAreaViewProps,
	SafeAreaView as SafeAreaViewRN,
} from "react-native-safe-area-context";
import { withUniwind } from "uniwind";

type Props = SafeAreaViewProps & PropsWithChildren;

const SafeAreaView = withUniwind(SafeAreaViewRN);

const TopInsetContext = createContext(false);

export function TopInsetProvider({ children }: PropsWithChildren) {
	return <TopInsetContext.Provider value={true}>{children}</TopInsetContext.Provider>;
}

function edgesWithoutTop(edges: NonNullable<Props["edges"]>): NonNullable<Props["edges"]> {
	if (Array.isArray(edges)) {
		return edges.filter((edge) => edge !== "top");
	}
	return { ...edges, top: "off" };
}

export default function AppShell({ children, edges = ["top"], className, ...props }: Props) {
	const topInsetHandled = useContext(TopInsetContext);
	const resolvedEdges = topInsetHandled ? edgesWithoutTop(edges) : edges;

	return (
		<SafeAreaView
			className={`flex-1 py-6 px-5.5 bg-background ${className}`}
			edges={resolvedEdges}
			mode="padding"
			{...props}
		>
			{children}
		</SafeAreaView>
	);
}
