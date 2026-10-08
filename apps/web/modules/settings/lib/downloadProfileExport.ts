import { limaDateToInputValue } from "@/shared/lib/date";

export async function downloadProfileExport(fetchExport: () => Promise<unknown>): Promise<void> {
	const data = await fetchExport();
	const blob = new Blob([JSON.stringify(data, null, 2)], {
		type: "application/json",
	});
	const url = URL.createObjectURL(blob);
	const anchor = document.createElement("a");
	anchor.href = url;
	anchor.download = `quipu-mis-datos-${limaDateToInputValue(Date.now())}.json`;
	anchor.click();
	URL.revokeObjectURL(url);
}
