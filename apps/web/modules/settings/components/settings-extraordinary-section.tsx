"use client";

import { useState } from "react";
import { ChevronDown } from "reicon-react/icons/ChevronDown";
import { toast } from "sonner";
import { fromConvexError } from "@/core/errors";
import { useMyProfile } from "@/modules/auth/hooks/use-my-profile";
import { PremiumLockPrompt } from "@/shared/components/premium-lock-prompt";
import { Skeleton } from "@/shared/components/ui/skeleton";
import {
	type ExtraordinaryProfileRule,
	type ExtraordinaryRules,
	type ExtraordinaryRulesAutoApply,
	extraordinaryProfileRuleLabel,
	mergeExtraordinaryRules,
	mergeExtraordinaryRulesAutoApply,
} from "@/shared/lib/extraordinaryIncome";
import { cn } from "@/shared/lib/utils";
import { useUpdateExtraordinaryRules } from "../actions";
import {
	SETTINGS_EXTRAORDINARY_AUTO_APPLY_HINT,
	SETTINGS_EXTRAORDINARY_AUTO_APPLY_LABEL,
	SETTINGS_EXTRAORDINARY_AUTO_APPLY_LOCK_BODY,
	SETTINGS_EXTRAORDINARY_AUTO_APPLY_LOCK_TITLE,
	SETTINGS_EXTRAORDINARY_BONUS,
	SETTINGS_EXTRAORDINARY_BONUS_HINT,
	SETTINGS_EXTRAORDINARY_CTS,
	SETTINGS_EXTRAORDINARY_CTS_HINT,
	SETTINGS_EXTRAORDINARY_CUSTOM,
	SETTINGS_EXTRAORDINARY_CUSTOM_HINT,
	SETTINGS_EXTRAORDINARY_DESCRIPTION,
	SETTINGS_EXTRAORDINARY_FOOTER,
	SETTINGS_EXTRAORDINARY_GRATIFICATIONS,
	SETTINGS_EXTRAORDINARY_GRATIFICATIONS_HINT,
	SETTINGS_EXTRAORDINARY_LABEL,
	SETTINGS_EXTRAORDINARY_PROFIT,
	SETTINGS_EXTRAORDINARY_PROFIT_HINT,
} from "../constants";
import {
	activeOptimisticAutoApply,
	decideAutoApplyToggle,
	dropOptimisticKey,
	patchAutoApply,
} from "../lib/autoApplyToggle";
import { SettingsSection } from "./settings-section";
import { SettingsToggle } from "./settings-toggle";

const RULE_OPTIONS: ExtraordinaryProfileRule[] = [
	"profile_default",
	"all_to_savings",
	"all_to_emergency_fund",
	"ask_each_time",
];

const ROWS: ReadonlyArray<{
	key: keyof ExtraordinaryRules;
	label: string;
	subtitle: string;
	icon: "grati" | "cts" | "bonus" | "profit" | "custom";
}> = [
	{
		key: "gratifications",
		label: SETTINGS_EXTRAORDINARY_GRATIFICATIONS,
		subtitle: SETTINGS_EXTRAORDINARY_GRATIFICATIONS_HINT,
		icon: "grati",
	},
	{
		key: "cts",
		label: SETTINGS_EXTRAORDINARY_CTS,
		subtitle: SETTINGS_EXTRAORDINARY_CTS_HINT,
		icon: "cts",
	},
	{
		key: "corporate_bonus",
		label: SETTINGS_EXTRAORDINARY_BONUS,
		subtitle: SETTINGS_EXTRAORDINARY_BONUS_HINT,
		icon: "bonus",
	},
	{
		key: "profit_sharing",
		label: SETTINGS_EXTRAORDINARY_PROFIT,
		subtitle: SETTINGS_EXTRAORDINARY_PROFIT_HINT,
		icon: "profit",
	},
	{
		key: "custom",
		label: SETTINGS_EXTRAORDINARY_CUSTOM,
		subtitle: SETTINGS_EXTRAORDINARY_CUSTOM_HINT,
		icon: "custom",
	},
];

function RowIcon({ kind }: { kind: (typeof ROWS)[number]["icon"] }) {
	return (
		<span className="flex size-[34px] shrink-0 items-center justify-center rounded-[10px] bg-extraordinary-icon-bg">
			{kind === "grati" ? (
				<span className="size-3 rotate-45 rounded-[3px] bg-extraordinary-a" aria-hidden />
			) : null}
			{kind === "cts" ? (
				<span
					className="h-[11px] w-[15px] rounded-[3px] border-2 border-extraordinary-a"
					aria-hidden
				/>
			) : null}
			{kind === "bonus" ? (
				<span className="size-3 rounded-full border-2 border-extraordinary-a" aria-hidden />
			) : null}
			{kind === "profit" ? (
				<span className="flex gap-0.5" aria-hidden>
					<span className="h-3 w-0.5 rounded-sm bg-extraordinary-a" />
					<span className="h-3 w-0.5 rounded-sm bg-extraordinary-a" />
					<span className="h-3 w-0.5 rounded-sm bg-extraordinary-a" />
				</span>
			) : null}
			{kind === "custom" ? (
				<span className="relative size-3.5" aria-hidden>
					<span className="absolute top-1.5 left-0 h-0.5 w-3.5 rounded-full bg-extraordinary-a" />
					<span className="absolute top-0 left-1.5 h-3.5 w-0.5 rounded-full bg-extraordinary-a" />
				</span>
			) : null}
		</span>
	);
}

export function SettingsExtraordinarySection({ className }: { className?: string }) {
	const profile = useMyProfile();
	const updateRules = useUpdateExtraordinaryRules();
	const [showAutoApplyPaywall, setShowAutoApplyPaywall] = useState(false);
	const [optimisticAutoApply, setOptimisticAutoApply] =
		useState<Partial<ExtraordinaryRulesAutoApply> | null>(null);
	const [pendingKey, setPendingKey] = useState<keyof ExtraordinaryRulesAutoApply | null>(null);

	const serverAutoApply = mergeExtraordinaryRulesAutoApply(profile?.extraordinaryRulesAutoApply);
	// Derive: ignore optimistic keys already reflected by the server (no effect).
	const optimisticOverride = activeOptimisticAutoApply(serverAutoApply, optimisticAutoApply);

	if (profile === undefined) {
		return (
			<SettingsSection className={className}>
				<Skeleton variant="line" className="h-3 w-32" />
				<Skeleton variant="line" className="mt-2 h-4 w-full max-w-md" />
				<Skeleton className="mt-4 h-48 w-full rounded-xl [animation-delay:150ms]" />
			</SettingsSection>
		);
	}

	if (profile === null) return null;

	const rules = mergeExtraordinaryRules(profile.extraordinaryRules);
	const autoApply = {
		...serverAutoApply,
		...optimisticOverride,
	};
	const isPremium = profile.plan === "premium";

	async function onRuleChange(key: keyof ExtraordinaryRules, value: ExtraordinaryProfileRule) {
		try {
			const nextRules = { ...rules, [key]: value };
			const nextAutoApply = { ...autoApply };
			if (value === "ask_each_time") {
				nextAutoApply[key] = false;
				setOptimisticAutoApply((prev) => ({ ...prev, [key]: false }));
			}
			await updateRules({
				extraordinaryRules: nextRules,
				...(isPremium ? { extraordinaryRulesAutoApply: nextAutoApply } : {}),
			});
			if (value === "ask_each_time") {
				setOptimisticAutoApply((prev) => dropOptimisticKey(prev, key));
			}
		} catch (error) {
			setOptimisticAutoApply(null);
			toast.error(fromConvexError(error).message);
		}
	}

	async function onAutoApplyChange(key: keyof ExtraordinaryRulesAutoApply, checked: boolean) {
		const decision = decideAutoApplyToggle({
			isPremium,
			pending: pendingKey === key,
			currentChecked: Boolean(autoApply[key]),
			nextChecked: checked,
		});
		if (decision === "paywall") {
			setShowAutoApplyPaywall(true);
			return;
		}
		if (decision === "skip") return;

		const nextAutoApply = patchAutoApply(autoApply, key, checked);
		setOptimisticAutoApply((prev) => ({ ...prev, [key]: checked }));
		setPendingKey(key);
		try {
			await updateRules({
				extraordinaryRules: rules,
				extraordinaryRulesAutoApply: nextAutoApply,
			});
			setOptimisticAutoApply((prev) => dropOptimisticKey(prev, key));
		} catch (error) {
			setOptimisticAutoApply((prev) => dropOptimisticKey(prev, key));
			toast.error(fromConvexError(error).message);
		}
		setPendingKey((current) => (current === key ? null : current));
	}

	return (
		<SettingsSection
			className={className}
			title={SETTINGS_EXTRAORDINARY_LABEL}
			description={SETTINGS_EXTRAORDINARY_DESCRIPTION}
		>
			<ul className="flex flex-col gap-2.5">
				{ROWS.map((row) => {
					const current = rules[row.key];
					const savingsRule = current === "all_to_savings" || current === "all_to_emergency_fund";
					const canAutoApply = current !== "ask_each_time";
					const toggleChecked = isPremium && autoApply[row.key];
					return (
						<li
							key={row.key}
							className="flex flex-col gap-3 rounded-xl border border-line/70 bg-card px-4 py-4 md:px-[18px] md:py-[15px]"
						>
							<div className="grid grid-cols-1 gap-3 sm:grid-cols-[auto_1fr_auto] sm:items-center sm:gap-3.5">
								<RowIcon kind={row.icon} />
								<div className="min-w-0 flex-1">
									<div className="font-semibold text-[15px] text-ink">{row.label}</div>
									<div className="text-[12.5px] text-mute">{row.subtitle}</div>
								</div>
								<label className="relative inline-flex min-w-[12rem] items-center">
									<select
										className={cn(
											"h-10 w-full cursor-pointer appearance-none rounded-[10px] border py-2 pr-9 pl-3.5 text-[13.5px] font-semibold outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50",
											savingsRule
												? "border-qp-border bg-qp-soft text-qp-deep"
												: "border-line bg-control text-ink",
										)}
										value={current}
										onChange={(event) =>
											void onRuleChange(row.key, event.target.value as ExtraordinaryProfileRule)
										}
									>
										{RULE_OPTIONS.map((option) => (
											<option key={option} value={option}>
												{extraordinaryProfileRuleLabel(option)}
											</option>
										))}
									</select>
									<ChevronDown
										size={14}
										className={cn(
											"pointer-events-none absolute right-3",
											savingsRule ? "text-qp-deep" : "text-mute",
										)}
										aria-hidden
									/>
								</label>
							</div>

							{canAutoApply ? (
								<div className="flex items-center justify-between gap-3 rounded-lg bg-surface-warm/40 px-3.5 py-3">
									<div className="min-w-0">
										<p className="text-[13px] font-medium text-ink">
											{SETTINGS_EXTRAORDINARY_AUTO_APPLY_LABEL}
										</p>
										<p className="text-[12px] text-mute">
											{SETTINGS_EXTRAORDINARY_AUTO_APPLY_HINT}
										</p>
									</div>
									<SettingsToggle
										label={`${SETTINGS_EXTRAORDINARY_AUTO_APPLY_LABEL} — ${row.label}`}
										checked={toggleChecked}
										disabled={pendingKey === row.key}
										onCheckedChange={(checked) => void onAutoApplyChange(row.key, checked)}
									/>
								</div>
							) : null}
						</li>
					);
				})}
			</ul>

			<PremiumLockPrompt
				open={showAutoApplyPaywall}
				onOpenChange={setShowAutoApplyPaywall}
				title={SETTINGS_EXTRAORDINARY_AUTO_APPLY_LOCK_TITLE}
				body={SETTINGS_EXTRAORDINARY_AUTO_APPLY_LOCK_BODY}
				currencyCode={profile.currencyCode}
			/>

			<p className="mt-3 text-[12.5px] leading-snug text-mute">{SETTINGS_EXTRAORDINARY_FOOTER}</p>
		</SettingsSection>
	);
}
