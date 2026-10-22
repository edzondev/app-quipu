import type { ReactNode } from "react";
import { Pressable, Text, View } from "react-native";
import { ArrowUpRight, ChevronRight } from "@/shared/components/ui/reicon";
import { HIT_SLOP } from "@/shared/lib/hit-slop";

type Props = {
	label: string;
	value?: string | null;
	valueClass?: string;
	subtitle?: string | null;
	subtitleClass?: string;
	dotClass?: string;
	trailing?: ReactNode;
	onPress?: () => void;
	external?: boolean;
	isLast?: boolean;
	testID?: string;
};

export function ListRow({
	label,
	value,
	valueClass = "text-foreground/45",
	subtitle,
	subtitleClass = "text-foreground/55",
	dotClass,
	trailing,
	onPress,
	external = false,
	isLast = false,
	testID,
}: Props) {
	const row = (
		<View
			testID={onPress ? undefined : testID}
			className={`flex-row items-center justify-between ${dotClass ? "py-[17px]" : "py-3.5"} ${
				isLast ? "" : "border-b border-foreground/10"
			}`}
		>
			<View className="min-w-0 flex-1 flex-row items-center gap-[13px] pr-3">
				{dotClass ? <View className={`h-2 w-2 rounded-full ${dotClass}`} /> : null}
				<View className="min-w-0 flex-1">
					<Text
						className={
							dotClass
								? "font-hanken-semibold text-[15.5px] text-foreground"
								: "font-hanken text-[15px] text-foreground"
						}
					>
						{label}
					</Text>
					{subtitle ? (
						<Text className={`mt-1.5 font-hanken text-[12.5px] ${subtitleClass}`} numberOfLines={2}>
							{subtitle}
						</Text>
					) : null}
				</View>
			</View>
			<View className="flex-row items-center gap-2.5">
				{value ? (
					<Text
						className={`font-hanken tabular-nums ${valueClass} ${
							dotClass ? "text-[14px]" : "text-[13px]"
						}`}
					>
						{value}
					</Text>
				) : null}
				{trailing}
				{onPress ? (
					external ? (
						<ArrowUpRight size={14} strokeWidth={1.5} colorClassName="accent-foreground/45" />
					) : (
						<ChevronRight size={14} colorClassName="accent-foreground/45" />
					)
				) : null}
			</View>
		</View>
	);
	if (!onPress) return row;
	return (
		<Pressable
			testID={testID}
			accessibilityRole="button"
			accessibilityLabel={label}
			hitSlop={HIT_SLOP}
			onPress={onPress}
			className="active:opacity-60"
		>
			{row}
		</Pressable>
	);
}
