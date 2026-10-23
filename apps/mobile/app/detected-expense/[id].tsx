import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { View } from "react-native";
import {
	getInstalledBanks,
	getPendingNotifications,
	type InstalledBank,
	type PendingNotification,
} from "@/modules/quipu-notification-listener";
import { DetectedExpenseSheet } from "@/shared/components/expenses/detected-expense-sheet";
import { useHardwareBack } from "@/shared/hooks/use-hardware-back";
import { routeParam } from "@/shared/lib/expenses/expense-record";

export default function DetectedExpenseRoute() {
	const router = useRouter();
	const params = useLocalSearchParams();
	const id = routeParam(params.id);
	const [item, setItem] = useState<PendingNotification | null>(null);
	const [bankName, setBankName] = useState("");

	function close() {
		if (router.canGoBack()) router.back();
		else router.replace("/(tabs)");
	}

	useHardwareBack(close);

	useEffect(() => {
		let alive = true;
		// close is a new function each render, so the effect follows router.
		function leave() {
			if (router.canGoBack()) router.back();
			else router.replace("/(tabs)");
		}
		async function load() {
			let pending: PendingNotification[] | null = null;
			try {
				pending = await getPendingNotifications();
			} catch {
				pending = null;
			}
			if (!alive) return;
			const found = pending?.find((entry) => entry.id === id);
			if (!found) {
				leave();
				return;
			}
			let banks: InstalledBank[] | null = null;
			try {
				banks = await getInstalledBanks();
			} catch {
				banks = null;
			}
			if (!alive) return;
			const bank = banks?.find((entry) => entry.packageId === found.packageName);
			setBankName(bank?.label || bank?.name || "Otra app");
			setItem(found);
		}
		if (id) void load();
		else leave();
		return () => {
			alive = false;
		};
	}, [id, router]);

	if (!item) return <View className="flex-1 bg-background" />;

	return <DetectedExpenseSheet key={item.id} item={item} bankName={bankName} onClose={close} />;
}
