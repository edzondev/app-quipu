"use client";

import * as Sentry from "@sentry/nextjs";
import { useEffect } from "react";
import { captureException } from "@/core/analytics";

export default function GlobalError({
	error,
	reset,
}: {
	error: Error & { digest?: string };
	reset: () => void;
}) {
	useEffect(() => {
		Sentry.captureException(error);
		captureException(error, { source: "global-error-boundary" });
	}, [error]);

	return (
		<html lang="en">
			<body>
				<main>
					<h1>Something went wrong</h1>
					<p>An unexpected error occurred.</p>
					<button type="button" onClick={() => reset()}>
						Try again
					</button>
				</main>
			</body>
		</html>
	);
}
