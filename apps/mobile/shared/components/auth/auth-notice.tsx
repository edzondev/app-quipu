import { Pressable, Text, View } from "react-native";
import type { AuthNoticeCopy } from "@/shared/lib/auth/errors";
import { HIT_SLOP } from "@/shared/lib/hit-slop";

const TONE_CLASS = {
	warning: "bg-warning/15",
	info: "bg-secondary/10",
	danger: "bg-danger/10",
} as const;

const TEXT_CLASS = {
	warning: "text-warning",
	info: "text-secondary",
	danger: "text-danger",
} as const;

export function AuthNotice({
	tone,
	message,
	actionLabel,
	onAction,
}: AuthNoticeCopy & { onAction?: () => void }) {
	return (
		<View
			accessibilityRole="alert"
			accessibilityLiveRegion="polite"
			className={`flex-row items-center gap-2.5 rounded-xl px-3.5 py-2.5 ${TONE_CLASS[tone]}`}
		>
			<Text className={`flex-1 font-hanken text-[12.5px] leading-[17px] ${TEXT_CLASS[tone]}`}>
				{message}
			</Text>
			{actionLabel && onAction ? (
				<Pressable
					onPress={onAction}
					hitSlop={HIT_SLOP}
					accessibilityRole="button"
					className="active:opacity-60"
				>
					<Text className={`font-hanken-semibold text-[12.5px] ${TEXT_CLASS[tone]}`}>
						{actionLabel}
					</Text>
				</Pressable>
			) : null}
		</View>
	);
}
