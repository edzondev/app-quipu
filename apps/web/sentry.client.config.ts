// This file configures the initialization of Sentry on the browser.
// https://docs.sentry.io/platforms/javascript/guides/nextjs/

import * as Sentry from "@sentry/nextjs";

Sentry.init({
	dsn: "https://7faea9a02bc67f81ccbe408dc4521db5@o4508739047325696.ingest.us.sentry.io/4511781939642368",

	tracesSampleRate: 1,

	enableLogs: true,

	dataCollection: {
		// https://docs.sentry.io/platforms/javascript/guides/nextjs/configuration/options/#dataCollection
	},
});
