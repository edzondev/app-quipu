import { Pressable, ScrollView, Text, View } from "react-native";
import { ListRow } from "@/shared/components/list-row";
import { SectionLabel } from "@/shared/components/section-label";
import { X } from "@/shared/components/ui/reicon";
import { HIT_SLOP } from "@/shared/lib/hit-slop";
import type { SettingsScreenModel } from "@/shared/lib/settings/model";

type Props = {
	status: "loading" | "empty" | "ready";
	model: SettingsScreenModel | null;
	onClose: () => void;
};

export function SettingsScreen({ status, model, onClose }: Props) {
	return (
		<View className="flex-1">
			<View className="flex-row items-center justify-between">
				<Text className="font-newsreader text-[27px] leading-8 text-foreground">Ajustes</Text>
				<Pressable
					accessibilityRole="button"
					accessibilityLabel="Cerrar"
					hitSlop={HIT_SLOP}
					onPress={onClose}
					className="active:opacity-60"
				>
					<X size={22} colorClassName="accent-foreground" />
				</Pressable>
			</View>
			{status === "loading" ? (
				<Text className="mt-6 font-hanken text-[15px] text-foreground/55">Cargando…</Text>
			) : null}
			{model ? (
				<ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
					<View className="mt-[22px] flex-row items-center gap-3.5 border-b border-line pb-5">
						<View className="size-11 items-center justify-center rounded-full bg-line">
							<Text className="font-newsreader text-[19px] text-primary">{model.initial}</Text>
						</View>
						<View className="min-w-0 flex-1">
							<Text className="font-hanken-semibold text-[15px] text-foreground">{model.name}</Text>
							{model.meta ? (
								<Text className="mt-1.5 font-hanken text-[12.5px] text-foreground/45">
									{model.meta}
								</Text>
							) : null}
						</View>
					</View>
					<View className="mt-5">
						<SectionLabel className="mb-1">CUENTA</SectionLabel>
						<ListRow label="Perfil y datos" />
						{model.passkeysLabel ? (
							<ListRow label="Seguridad y Passkeys" value={model.passkeysLabel} />
						) : null}
						<ListRow label="Plan y suscripción" value={model.planLabel} isLast />
					</View>
					<View className="mt-[18px] border-t border-line pt-4">
						<SectionLabel className="mb-1">TU SISTEMA</SectionLabel>
						<ListRow label="Reparto" value={model.repartoLabel} />
						<ListRow label="Ciclo e ingresos" value={model.scheduleCopy} isLast />
					</View>
				</ScrollView>
			) : null}
		</View>
	);
}
