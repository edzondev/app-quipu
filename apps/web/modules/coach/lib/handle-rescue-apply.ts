import type { Id } from "@/convex/_generated/dataModel";
import { fromConvexError } from "@/core/errors";

export type RescueApplyResult =
	| {
			kind: "applied";
			transfer: number;
			savingsRemaining: number;
			wantsRemaining: number;
	  }
	| { kind: "error"; code: string; message: string };

type ApplyRescueFn = (args: { interactionId: Id<"coachInteractions"> }) => Promise<{
	success: boolean;
	transfer: number;
	savingsRemaining: number;
	wantsRemaining: number;
}>;

export async function handleRescueApply(args: {
	applyRescue: ApplyRescueFn;
	interactionId: Id<"coachInteractions">;
}): Promise<RescueApplyResult> {
	try {
		const result = await args.applyRescue({
			interactionId: args.interactionId,
		});
		return {
			kind: "applied",
			transfer: result.transfer,
			savingsRemaining: result.savingsRemaining,
			wantsRemaining: result.wantsRemaining,
		};
	} catch (err) {
		const appError = fromConvexError(err);
		return { kind: "error", code: appError.code, message: appError.message };
	}
}
