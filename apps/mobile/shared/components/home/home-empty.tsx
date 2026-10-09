import { Pressable, Text, View } from "react-native";
import { HomeIdentity } from "./home-identity";

function EmptyIllustration() {
	return (
		<View
			accessibilityElementsHidden
			importantForAccessibility="no-hide-descendants"
			className="mb-7 h-40 w-40 items-center justify-center"
		>
			<View className="absolute h-36 w-36 rounded-full bg-primary/10" />
			<View className="h-[78px] w-[96px]">
				<View className="absolute -top-1 left-0 h-5 w-11 rounded-t-lg bg-warning/80" />
				<View className="absolute top-3 h-[62px] w-full rounded-2xl bg-warning" />
				<View className="absolute top-8 left-4 h-6 w-16 rounded-md bg-background/80" />
			</View>
		</View>
	);
}

export function HomeLoading() {
	return (
		<View className="flex-1 items-center justify-center">
			<Text className="font-hanken text-[15px] text-foreground/55">Cargando…</Text>
		</View>
	);
}

export function HomeEmpty({
	name,
	initial,
	onOpenSettings,
	onRegisterIncome,
}: {
	name: string;
	initial: string;
	onOpenSettings: () => void;
	onRegisterIncome: () => void;
}) {
	return (
		<View className="flex-1">
			<HomeIdentity
				initial={initial}
				title={name}
				onOpenSettings={onOpenSettings}
				onRegisterIncome={onRegisterIncome}
			/>
			<View className="flex-1 items-center justify-center px-4">
				<EmptyIllustration />
				<Text className="text-center font-hanken-semibold text-[18px] text-foreground">
					Aún no hay ciclo
				</Text>
				<Text className="mt-2 max-w-[280px] text-center font-hanken text-[14px] leading-5 text-foreground/55">
					Registra tu primer ingreso para ver cuánto puedes gastar hoy.
				</Text>
				<Pressable
					accessibilityRole="button"
					onPress={onRegisterIncome}
					className="mt-8 rounded-xl bg-foreground px-[22px] py-3.5 active:opacity-80"
				>
					<Text className="font-hanken-semibold text-[14px] text-background">
						Registrar ingreso
					</Text>
				</Pressable>
			</View>
		</View>
	);
}
