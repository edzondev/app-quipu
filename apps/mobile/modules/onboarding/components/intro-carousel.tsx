import { useRouter } from "expo-router";
import { useRef, useState } from "react";
import {
	Dimensions,
	FlatList,
	type NativeScrollEvent,
	type NativeSyntheticEvent,
	Pressable,
	Text,
	View,
} from "react-native";
import type { EnvelopeKey } from "@/shared/lib/onboarding/types";
import { ENVELOPE_BG } from "./envelopes";
import { INTRO_SLIDES, type IntroSlide } from "./intro-slides";
import { MonoLabel } from "./mono-label";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

const SEGMENT_WIDTH: Record<EnvelopeKey, "50%" | "30%" | "20%"> = {
	needs: "50%",
	wants: "30%",
	savings: "20%",
};

function SegmentBar({
	segments,
	note,
}: {
	segments: NonNullable<IntroSlide["segments"]>;
	note?: string;
}) {
	return (
		<View className="mt-6">
			<View className="h-3 w-full flex-row overflow-hidden rounded-md">
				{segments.map((segment) => (
					<View
						key={segment.label}
						className={ENVELOPE_BG[segment.color]}
						style={{ width: SEGMENT_WIDTH[segment.color] }}
					/>
				))}
			</View>
			<View className="mt-4 gap-2">
				{segments.map((segment) => (
					<View key={segment.label} className="flex-row items-center justify-between">
						<Text className="font-hanken text-[14px] text-foreground/80">{segment.label}</Text>
						<Text className="font-geist-mono text-[13px] text-foreground/60">{segment.pct}</Text>
					</View>
				))}
			</View>
			{note ? (
				<Text className="mt-4 font-hanken text-[12.5px] text-foreground/45">{note}</Text>
			) : null}
		</View>
	);
}

function DailyCard({ label, value }: { label: string; value: string }) {
	return (
		<View className="mt-6 rounded-xl border border-line px-4 py-4">
			<MonoLabel>{label}</MonoLabel>
			<Text className="mt-2 font-geist-mono text-[28px] text-foreground">{value}</Text>
		</View>
	);
}

function RulesList({ rules }: { rules: string[] }) {
	return (
		<View className="mt-4 gap-1.5">
			{rules.map((rule) => (
				<Text key={rule} className="font-hanken text-[13.5px] text-foreground/60">
					{rule}
				</Text>
			))}
		</View>
	);
}

function SlideItem({
	slide,
	index,
	onPrimary,
	onSignIn,
}: {
	slide: IntroSlide;
	index: number;
	onPrimary: (slide: IntroSlide, index: number) => void;
	onSignIn: () => void;
}) {
	return (
		<View style={{ width: SCREEN_WIDTH }} className="px-6">
			<MonoLabel>{slide.eyebrow}</MonoLabel>
			<Text className="mt-4 font-newsreader text-[34px] leading-tight text-foreground">
				{slide.title}
			</Text>

			{slide.body ? (
				<Text className="mt-4 font-hanken text-[15px] text-foreground/70">{slide.body}</Text>
			) : null}

			{slide.quote ? (
				<Text className="mt-6 font-newsreader text-[19px] text-primary">{slide.quote}</Text>
			) : null}

			{slide.segmentBar && slide.segments ? (
				<SegmentBar segments={slide.segments} note={slide.segmentNote} />
			) : null}

			{slide.dailyCard ? (
				<DailyCard label={slide.dailyCard.label} value={slide.dailyCard.value} />
			) : null}

			{slide.rules ? <RulesList rules={slide.rules} /> : null}

			<View className="mt-8">
				<Pressable
					className="rounded-xl bg-primary px-5 py-4"
					onPress={() => onPrimary(slide, index)}
				>
					<Text className="text-center font-hanken-semibold text-[15px] text-foreground">
						{slide.cta}
					</Text>
				</Pressable>
				{slide.signInLink ? (
					<Pressable className="mt-4 px-5 py-2" onPress={onSignIn}>
						<Text className="text-center font-hanken text-[13.5px] text-foreground/55">
							Ya tengo cuenta
						</Text>
					</Pressable>
				) : null}
			</View>
		</View>
	);
}

export function IntroCarousel() {
	const router = useRouter();
	const listRef = useRef<FlatList<IntroSlide>>(null);
	const [activeIndex, setActiveIndex] = useState(0);

	const goToSlide = (index: number) => {
		listRef.current?.scrollToIndex({ index, animated: true });
	};

	const onMomentumScrollEnd = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
		const index = Math.round(event.nativeEvent.contentOffset.x / SCREEN_WIDTH);
		setActiveIndex(Math.min(Math.max(index, 0), INTRO_SLIDES.length - 1));
	};

	const handlePrimary = (slide: IntroSlide, index: number) => {
		if (slide.ctaAction === "next") {
			goToSlide(index + 1);
			return;
		}
		router.push("/(auth)/create-account");
	};

	const handleSignIn = () => {
		router.push("/(auth)/sign-in");
	};

	return (
		<View className="flex-1">
			<FlatList
				ref={listRef}
				testID="intro-list"
				data={INTRO_SLIDES}
				keyExtractor={(_, index) => `slide-${index}`}
				horizontal
				pagingEnabled
				showsHorizontalScrollIndicator={false}
				onMomentumScrollEnd={onMomentumScrollEnd}
				getItemLayout={(_, index) => ({
					length: SCREEN_WIDTH,
					offset: SCREEN_WIDTH * index,
					index,
				})}
				renderItem={({ item, index }) => (
					<SlideItem slide={item} index={index} onPrimary={handlePrimary} onSignIn={handleSignIn} />
				)}
			/>

			<View className="flex-row items-center justify-center gap-2 pb-8">
				{INTRO_SLIDES.map((slide, index) => (
					<View
						key={slide.eyebrow}
						testID={`dot-${index}`}
						className={
							index === activeIndex
								? "h-1 w-6 rounded-full bg-foreground"
								: "h-1 w-6 rounded-full bg-line"
						}
					/>
				))}
			</View>
		</View>
	);
}
