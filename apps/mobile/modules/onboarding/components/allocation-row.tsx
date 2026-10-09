import { Pressable, Text, View } from "react-native";
import { ALLOCATION_STEP } from "@/shared/lib/onboarding/allocation";
import { formatSoles } from "@/shared/lib/onboarding/daily";
import type { EnvelopeKey } from "@/shared/lib/onboarding/types";
import { ENVELOPE_BG, ENVELOPE_HINT, ENVELOPE_LABELS } from "./envelopes";
import { MonoLabel } from "./mono-label";

type AllocationRowProps = {
	envelope: EnvelopeKey;
	value: number;
	referenceIncomeCents: number | null;
} & (
	| {
			/** Necesidades y Gustos: la persona los sube o baja de a poco. */
			editable: true;
			canDecrease: boolean;
			canIncrease: boolean;
			onDecrease: () => void;
			onIncrease: () => void;
	  }
	| {
			/** Ahorro: nadie lo mueve, es lo que sobra. */
			editable: false;
	  }
);

function StepButton({
	envelope,
	direction,
	disabled,
	onPress,
}: {
	envelope: EnvelopeKey;
	direction: "decrease" | "increase";
	disabled: boolean;
	onPress: () => void;
}) {
	const verb = direction === "decrease" ? "Bajar" : "Subir";
	return (
		<Pressable
			testID={`allocation-${direction}-${envelope}`}
			accessibilityRole="button"
			accessibilityLabel={`${verb} ${ENVELOPE_LABELS[envelope]} ${ALLOCATION_STEP} puntos`}
			accessibilityState={{ disabled }}
			disabled={disabled}
			onPress={onPress}
			hitSlop={6}
			className={
				disabled
					? "size-10 items-center justify-center rounded-full border border-line opacity-35"
					: "size-10 items-center justify-center rounded-full border border-line active:bg-line/60"
			}
		>
			<Text className="font-hanken-semibold text-[20px] leading-6 text-foreground">
				{direction === "decrease" ? "−" : "+"}
			</Text>
		</Pressable>
	);
}

export function AllocationRow(props: AllocationRowProps) {
	const { envelope, value, referenceIncomeCents } = props;
	return (
		<View className="gap-3 rounded-2xl border border-line px-4 py-4">
			<View className="flex-row items-center gap-3">
				<View className={`h-2.5 w-2.5 rounded-full ${ENVELOPE_BG[envelope]}`} />
				<Text className="flex-1 font-hanken-semibold text-[15px] text-foreground">
					{ENVELOPE_LABELS[envelope]}
				</Text>
				{props.editable ? null : <MonoLabel>Automático</MonoLabel>}
			</View>
			<Text className="font-hanken text-[13px] text-foreground/55">{ENVELOPE_HINT[envelope]}</Text>
			<View className="flex-row items-center justify-between">
				<View className="flex-row items-baseline gap-2">
					<Text
						testID={`allocation-percent-${envelope}`}
						className="font-newsreader text-[32px] text-foreground"
					>
						{`${value}%`}
					</Text>
					{referenceIncomeCents ? (
						<Text
							testID={`allocation-amount-${envelope}`}
							className="font-hanken text-[13px] text-foreground/45"
						>
							{formatSoles(Math.floor((referenceIncomeCents * value) / 100))}
						</Text>
					) : null}
				</View>
				{props.editable ? (
					<View className="flex-row items-center gap-3">
						<StepButton
							envelope={envelope}
							direction="decrease"
							disabled={!props.canDecrease}
							onPress={props.onDecrease}
						/>
						<StepButton
							envelope={envelope}
							direction="increase"
							disabled={!props.canIncrease}
							onPress={props.onIncrease}
						/>
					</View>
				) : null}
			</View>
		</View>
	);
}
