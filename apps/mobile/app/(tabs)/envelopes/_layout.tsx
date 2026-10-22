import { Stack } from "expo-router";
import { useCSSVariable } from "uniwind";
import { tabStackScreenOptions } from "@/shared/lib/navigation/tab-stack-options";

export default function EnvelopesLayout() {
	const [background] = useCSSVariable(["--color-background"]) as [string];

	return <Stack screenOptions={tabStackScreenOptions(background)} />;
}
