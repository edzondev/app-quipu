import { v } from "convex/values";
import { internalMutation } from "../_generated/server";
import { APP_DATA_TABLES } from "./appDataTables";

export const resetAppTables = internalMutation({
	args: {},
	returns: v.object({ deleted: v.record(v.string(), v.number()) }),
	handler: async (ctx) => {
		const counts: Record<string, number> = {};

		const tableDocs = await Promise.all(
			APP_DATA_TABLES.map(async (table) => ({
				table,
				docs: await ctx.db.query(table).collect(),
			})),
		);

		for (const { table, docs } of tableDocs) {
			counts[table] = docs.length;
		}

		await Promise.all(tableDocs.flatMap(({ docs }) => docs.map((doc) => ctx.db.delete(doc._id))));

		return { deleted: counts };
	},
});
