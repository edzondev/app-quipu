import { useRouter } from "expo-router";
import AppShell from "@/shared/components/app-shell";
import { MovementsList } from "@/shared/components/movements/movements-list";
import { useRegistrar } from "@/shared/components/navigation/registrar-context";
import { useMovements } from "@/shared/hooks/use-movements";

export default function MovementsPage() {
	const list = useMovements();
	const router = useRouter();
	const { openCreate } = useRegistrar();
	const noCycle = list.status === "ready" && list.data?.cycle == null;

	return (
		<AppShell>
			<MovementsList
				status={list.status}
				data={list.status === "ready" ? list.data : null}
				onOpenExpense={(id) => {
					router.push(`/expense/${id}`);
				}}
				onCreate={() => openCreate(noCycle ? "income" : "auto")}
			/>
		</AppShell>
	);
}
