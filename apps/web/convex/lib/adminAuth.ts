import { ConvexError } from "convex/values";

export function assertAdminSecret(provided: string): void {
	const expected = process.env.ADMIN_SECRET;
	if (!expected || provided !== expected) {
		throw new ConvexError({
			code: "UNAUTHORIZED",
			message: "Admin secret inválido.",
		});
	}
}
