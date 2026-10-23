import { useRouter } from "expo-router";
import { useEffect } from "react";
import { HomeClosedCycle } from "@/shared/components/home/home-closed-cycle";
import { HomeDense } from "@/shared/components/home/home-dense";
import { HomeEmpty, HomeLoading } from "@/shared/components/home/home-empty";
import { useRegistrar } from "@/shared/components/navigation/registrar-context";
import { useHomeModel } from "@/shared/hooks/use-dashboard";
import { formatCents } from "@/shared/lib/money";
import { updateSpendableWidget } from "@/widgets/SpendableToday";

export default function HomePage() {
	const model = useHomeModel();
	const router = useRouter();
	const { openCreate } = useRegistrar();
	const amount =
		model.status === "ready"
			? formatCents(model.home.dailyCents, model.home.currencySymbol)
			: model.status === "loading"
				? undefined
				: null;

	useEffect(() => {
		if (amount !== undefined) updateSpendableWidget(amount);
	}, [amount]);

	return (
		<>
			{model.status === "loading" ? <HomeLoading /> : null}
			{model.status === "empty" ? (
				<HomeEmpty
					name={model.profileName}
					initial={model.profileInitial}
					onOpenSettings={() => router.push("/ajustes")}
					onRegisterIncome={() => openCreate("income")}
				/>
			) : null}
			{model.status === "closed" ? (
				<HomeClosedCycle
					name={model.profileName}
					initial={model.profileInitial}
					closedCycle={model.closedCycle}
					currencySymbol={model.currencySymbol}
					onOpenSettings={() => router.push("/ajustes")}
					onRegisterIncome={() => openCreate("income")}
				/>
			) : null}
			{model.status === "ready" ? (
				<HomeDense
					home={model.home}
					profileInitial={model.profileInitial}
					profileName={model.profileName}
					onOpenSettings={() => router.push("/ajustes")}
					onViewAllMovements={() => router.push("/(tabs)/movements")}
				/>
			) : null}
		</>
	);
}
