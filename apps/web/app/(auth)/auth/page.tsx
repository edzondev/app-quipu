import { redirect } from "next/navigation";
import { pageMetadata } from "@/core/seo";

export const metadata = pageMetadata({
	title: "Autenticación",
	path: "/auth",
	index: false,
});

/** Ruta legacy del flujo unificado. El canon vive en /sign-in y /sign-up. */
export default function LegacyAuthPage() {
	redirect("/sign-in");
}
