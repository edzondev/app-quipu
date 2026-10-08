export type SpaceStatus = "active" | "readonly" | "closed";
export type SpaceRole = "owner" | "member";

const STATUS_LABELS: Record<SpaceStatus, string> = {
	active: "Activo",
	readonly: "Solo lectura",
	closed: "Cerrado",
};

const ROLE_LABELS: Record<SpaceRole, string> = {
	owner: "Titular",
	member: "Miembro",
};

export function formatSpaceStatus(status: SpaceStatus): string {
	return STATUS_LABELS[status];
}

export function formatSpaceRole(role: SpaceRole): string {
	return ROLE_LABELS[role];
}

export function formatSpaceAllocationSummary(
	needs: number,
	wants: number,
	savings: number,
): string {
	return `${needs}% necesidades · ${wants}% gustos · ${savings}% ahorro`;
}

export function spaceStatusBadgeClass(status: SpaceStatus): string {
	switch (status) {
		case "active":
			return "border-qp-border bg-qp-soft text-qp-deep";
		case "readonly":
			return "border-line bg-surface-warm text-mute";
		case "closed":
			return "border-line bg-canvas text-faint";
	}
}
