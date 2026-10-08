import type { Id, TableNames } from "../../../apps/web/convex/_generated/dataModel";

// Convex Id is a branded string; this assertion keeps the runtime value a primitive string.
export const fixtureId = <T extends TableNames>(table: T, id: string): Id<T> =>
	id as Id<typeof table>;
