export type SpaceStatus = "active" | "readonly" | "closed";
export type SpaceRole = "owner" | "member";

export type SpaceSettingsSection =
	| "name"
	| "allocation"
	| "cycle"
	| "contribution"
	| "members"
	| "close"
	| "leave"
	| "reactivate";

export function canEditSpaceSettingsSection(
	role: SpaceRole,
	status: SpaceStatus,
	section: SpaceSettingsSection,
	options?: {
		isWritable?: boolean;
		canReactivate?: boolean;
		targetIsSelf?: boolean;
	},
): boolean {
	const isWritable = options?.isWritable ?? status === "active";

	switch (section) {
		case "name":
			return role === "owner" && isWritable;
		case "allocation":
		case "cycle":
			return role === "owner" && isWritable;
		case "contribution":
			if (!isWritable) return false;
			if (role === "owner") return true;
			return options?.targetIsSelf === true;
		case "members":
			return role === "owner" && isWritable;
		case "close":
			return role === "owner" && status !== "closed";
		case "leave":
			return role === "member";
		case "reactivate":
			return role === "owner" && options?.canReactivate === true;
		default:
			return false;
	}
}
