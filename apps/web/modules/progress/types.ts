import type { FunctionReturnType } from "convex/server";
import type { api } from "@/convex/_generated/api";

export type ProgressOverview = NonNullable<FunctionReturnType<typeof api.progress.getOverview>>;

export type ProgressRewards = NonNullable<FunctionReturnType<typeof api.progress.getRewards>>;

export type ProgressAchievement = ProgressOverview["achievements"][number];

export type ProgressChartBar = ProgressOverview["chartBars"][number];
