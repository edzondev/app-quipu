import { cronJobs } from "convex/server";
import { internal } from "./_generated/api";

const crons = cronJobs();

crons.interval(
	"content review scan",
	{ hours: 6 },
	internal.crons.contentReviewScan.scanOpenProfilesForContentFlags,
	{},
);

export default crons;
