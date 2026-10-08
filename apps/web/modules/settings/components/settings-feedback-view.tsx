"use client";

import { FeedbackForm } from "@/modules/feedback/components/feedback-form";
import {
	FEEDBACK_FOOTER,
	FEEDBACK_PAGE_SUBTITLE,
	FEEDBACK_PAGE_TITLE,
} from "@/modules/feedback/constants";
import { AppPageShell } from "@/shared/components/layout/app-page-shell";

export function SettingsFeedbackView() {
	return (
		<AppPageShell maxWidth="6xl" breadcrumbs="auto">
			<header className="mb-5 md:mb-6">
				<h1 className="font-serif text-[23px] font-medium text-ink md:text-[27px]">
					{FEEDBACK_PAGE_TITLE}
				</h1>
				<p className="mt-1 max-w-xl text-[12.5px] text-mute-subtle md:text-[13.5px]">
					{FEEDBACK_PAGE_SUBTITLE}
				</p>
			</header>

			<section className="max-w-xl rounded-xl border border-line/70 bg-card p-5 md:p-6">
				<FeedbackForm />
			</section>

			<p className="mt-4 max-w-xl text-[12.5px] text-mute-subtle">{FEEDBACK_FOOTER}</p>
		</AppPageShell>
	);
}
