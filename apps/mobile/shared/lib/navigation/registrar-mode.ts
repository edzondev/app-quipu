export type RegistrarIntent = "auto" | "expense" | "income";
export type RegistrarMode = "expense" | "income";

export function resolveRegistrarMode(intent: RegistrarIntent, hasCycle: boolean): RegistrarMode {
	if (intent === "income") return "income";
	if (intent === "expense") return "expense";
	return hasCycle ? "expense" : "income";
}
